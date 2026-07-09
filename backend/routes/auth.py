import os
import datetime
import importlib
import sqlite3
import uuid
import requests
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from functools import wraps

from config.config import Config
from models.db import USE_FIREBASE, create_user, get_user_by_email, get_user

# Firebase Auth imports if enabled
firebase_admin = None
if USE_FIREBASE:
    try:
        firebase_admin = importlib.import_module("firebase_admin")
        importlib.import_module("firebase_admin.auth")
    except ImportError:
        firebase_admin = None

auth_bp = Blueprint("auth", __name__)

# Helper to read Firebase Web API key
FIREBASE_WEB_API_KEY = os.getenv("VITE_FIREBASE_API_KEY", "")

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None

        # Extract Authorization header
        if "Authorization" in request.headers:
            auth_header = request.headers["Authorization"]
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]

        if not token:
            return jsonify({"error": "Authorization token is missing"}), 401

        try:
            if USE_FIREBASE:
                # Validate Firebase ID Token
                decoded_token = firebase_admin.auth.verify_id_token(token)
                request.uid = decoded_token["uid"]
                request.email = decoded_token.get("email", "")
            else:
                # Validate Local JWT Token
                decoded_token = jwt.decode(
                    token,
                    Config.SECRET_KEY,
                    algorithms=["HS256"]
                )
                request.uid = decoded_token["uid"]
                request.email = decoded_token.get("email", "")

        except Exception as e:
            print(f"Token verification failed: {e}")
            return jsonify({"error": "Token is invalid or expired"}), 401

        return f(*args, **kwargs)

    return decorated

@auth_bp.route("/signup", methods=["POST"])
def signup():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")
    name = data.get("name")
    carbon_budget = float(data.get("carbonBudget", 15.0)) # Default daily carbon budget (kg CO2)
    
    if not email or not password or not name:
        return jsonify({"error": "Missing required fields (email, password, name)"}), 400
        
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters long"}), 400
        
    # Check if user already exists
    existing = get_user_by_email(email)
    if existing:
        return jsonify({"error": "A user with this email already exists"}), 400
        
    try:
        if USE_FIREBASE:
            # Create user in Firebase Auth
            fb_user = firebase_admin.auth.create_user(
                email=email,
                password=password,
                display_name=name
            )
            uid = fb_user.uid
            # Store profile in Firestore
            user_profile = create_user(uid, name, email, carbon_budget)
            return jsonify({
                "message": "User registered successfully",
                "userId": uid,
                "user": user_profile
            }), 201
        else:
            # Local Mode registration with hashed password
            uid = str(uuid.uuid4())
            pwd_hash = generate_password_hash(password)
            user_profile = create_user(uid, name, email, carbon_budget, password_hash=pwd_hash)
            return jsonify({
                "message": "User registered successfully (Local Fallback Mode)",
                "userId": uid,
                "user": user_profile
            }), 201
            
    except Exception as e:
        print(f"Signup error: {e}")
        return jsonify({"error": str(e)}), 500

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")
    
    if not email or not password:
        return jsonify({"error": "Missing email or password"}), 400
        
    try:
        if USE_FIREBASE:
            # Since Firebase Admin SDK does not support sign-in with password,
            # we call the Google Identity Toolkit REST API
            api_key = FIREBASE_WEB_API_KEY or os.getenv("VITE_FIREBASE_API_KEY", "")
            if not api_key:
                return jsonify({"error": "VITE_FIREBASE_API_KEY environment variable is not set on the server."}), 500
                
            url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={api_key}"
            payload = {
                "email": email,
                "password": password,
                "returnSecureToken": True
            }
            res = requests.post(url, json=payload)
            res_data = res.json()
            
            if res.status_code != 200:
                err_msg = res_data.get("error", {}).get("message", "Authentication failed")
                return jsonify({"error": err_msg}), res.status_code
                
            uid = res_data["localId"]
            id_token = res_data["idToken"]
            
            # Fetch user details
            user_profile = get_user(uid)
            if not user_profile:
                # If auth exists but Firestore record is missing, create it
                user_profile = create_user(uid, email.split("@")[0], email, 15.0)
                
            return jsonify({
                "idToken": id_token,
                "localId": uid,
                "email": email,
                "name": user_profile.get("name", ""),
                "carbonBudget": user_profile.get("carbonBudget", 15.0),
                "streak": user_profile.get("streak", 0),
                "badges": user_profile.get("badges", [])
            }), 200
        else:
            # Local Mode validation
            user = get_user_by_email(email)
            if not user:
                return jsonify({"error": "Invalid email or password"}), 401
                
            # Verify password hash
            conn = sqlite3.connect("ecotrack_local.db")
            print("Login DB path:", os.path.abspath("ecotrack_local.db"))
            conn.row_factory = sqlite3.Row
            db_user = conn.execute("SELECT password_hash FROM users WHERE uid = ?", (user["uid"],)).fetchone()
            conn.close()
            
            if not db_user or not check_password_hash(db_user["password_hash"], password):
                return jsonify({"error": "Invalid email or password"}), 401
                
            # Create local JWT
            expiry = datetime.datetime.utcnow() + datetime.timedelta(days=7)
            token_payload = {
                "uid": user["uid"],
                "email": user["email"],
                "exp": expiry
            }
            local_token = jwt.encode(token_payload, Config.SECRET_KEY, algorithm="HS256")
            
            return jsonify({
                "idToken": local_token,
                "localId": user["uid"],
                "email": user["email"],
                "name": user["name"],
                "carbonBudget": user["carbonBudget"],
                "streak": user["streak"],
                "badges": user["badges"]
            }), 200
            
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({"error": str(e)}), 500
