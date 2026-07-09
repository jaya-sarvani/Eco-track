import json
import sqlite3
import datetime
from config.config import Config

# Global database variables
db_client = None
USE_FIREBASE = Config.USE_FIREBASE

if USE_FIREBASE:
    try:
        import firebase_admin
        from firebase_admin import credentials, firestore

        # Initialize Firebase Admin once
        try:
            if not firebase_admin._apps:
                cred = credentials.Certificate("serviceAccountKey.json")
                firebase_admin.initialize_app(cred)
            db_client = firestore.client()
            print("Firebase Admin successfully initialized. Mode: FIRESTORE")
        except Exception as e:
            print(f"Error initializing Firebase Admin: {e}. Falling back to SQLite mode.")
            USE_FIREBASE = False
    except Exception as e:
        # firebase_admin not installed or import failed
        print(f"firebase_admin import failed: {e}. Falling back to SQLite mode.")
        USE_FIREBASE = False

# SQLite database file path
SQLITE_DB_PATH = "ecotrack_local.db"
print(f"Using SQLite DB: {SQLITE_DB_PATH}")

def db_init():
    if not USE_FIREBASE:
        print(f"Initializing SQLite database at: {SQLITE_DB_PATH}")
        conn = sqlite3.connect(SQLITE_DB_PATH)
        cursor = conn.cursor()
        
        # Create users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                uid TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT,
                carbonBudget REAL DEFAULT 15.0,
                streak INTEGER DEFAULT 0,
                badges TEXT DEFAULT '[]',
                createdAt TEXT
            )
        """)
        
        # Create logs table (composite key userId + date)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS logs (
                userId TEXT NOT NULL,
                date TEXT NOT NULL,
                travel TEXT,
                food TEXT,
                energy TEXT,
                totalEmission REAL DEFAULT 0.0,
                createdAt TEXT,
                PRIMARY KEY (userId, date)
            )
        """)
        
        # Create suggestions table (composite key userId + date)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS suggestions (
                userId TEXT NOT NULL,
                date TEXT NOT NULL,
                recommendations TEXT,
                createdAt TEXT,
                PRIMARY KEY (userId, date)
            )
        """)
        
        conn.commit()
        conn.close()

def get_db_connection():
    conn = sqlite3.connect(SQLITE_DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

# User DB Operations
def get_user(uid):
    if USE_FIREBASE:
        doc = db_client.collection("users").document(uid).get()
        if doc.exists:
            user = doc.to_dict()
            if "badges" not in user:
                user["badges"] = []
            return user
        return None
    else:
        conn = get_db_connection()
        user = conn.execute("SELECT * FROM users WHERE uid = ?", (uid,)).fetchone()
        conn.close()
        if user:
            user_dict = dict(user)
            # Parse badges from JSON string
            try:
                user_dict["badges"] = json.loads(user_dict["badges"])
            except:
                user_dict["badges"] = []
            return user_dict
        return None

def get_user_by_email(email):
    if USE_FIREBASE:
        docs = db_client.collection("users").where("email", "==", email).limit(1).stream()
        for doc in docs:
            user = doc.to_dict()
            if "badges" not in user:
                user["badges"] = []
            return user
        return None
    else:
        conn = get_db_connection()
        user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
        conn.close()
        if user:
            user_dict = dict(user)
            try:
                user_dict["badges"] = json.loads(user_dict["badges"])
            except:
                user_dict["badges"] = []
            return user_dict
        return None

def create_user(uid, name, email, carbon_budget, password_hash=None):
    created_at = datetime.datetime.utcnow().isoformat()
    if USE_FIREBASE:
        user_data = {
            "uid": uid,
            "name": name,
            "email": email,
            "carbonBudget": float(carbon_budget),
            "streak": 0,
            "badges": [],
            "createdAt": created_at
        }
        db_client.collection("users").document(uid).set(user_data)
        return user_data
    else:
        conn = get_db_connection()
        conn.execute(
            "INSERT INTO users (uid, name, email, password_hash, carbonBudget, streak, badges, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (uid, name, email, password_hash, float(carbon_budget), 0, json.dumps([]), created_at)
        )
        conn.commit()
        conn.close()
        return {
            "uid": uid,
            "name": name,
            "email": email,
            "carbonBudget": float(carbon_budget),
            "streak": 0,
            "badges": [],
            "createdAt": created_at
        }

def update_user_stats(uid, streak, badges, carbon_budget=None):
    if USE_FIREBASE:
        update_data = {
            "streak": int(streak),
            "badges": badges
        }
        if carbon_budget is not None:
            update_data["carbonBudget"] = float(carbon_budget)
        db_client.collection("users").document(uid).update(update_data)
    else:
        conn = get_db_connection()
        if carbon_budget is not None:
            conn.execute(
                "UPDATE users SET streak = ?, badges = ?, carbonBudget = ? WHERE uid = ?",
                (int(streak), json.dumps(badges), float(carbon_budget), uid)
            )
        else:
            conn.execute(
                "UPDATE users SET streak = ?, badges = ? WHERE uid = ?",
                (int(streak), json.dumps(badges), uid)
            )
        conn.commit()
        conn.close()

# Logs DB Operations
def get_log(user_id, date):
    if USE_FIREBASE:
        doc_id = f"{user_id}_{date}"
        doc = db_client.collection("logs").document(doc_id).get()
        if doc.exists:
            log_data = doc.to_dict()
            return log_data
        return None
    else:
        conn = get_db_connection()
        log = conn.execute("SELECT * FROM logs WHERE userId = ? AND date = ?", (user_id, date)).fetchone()
        conn.close()
        if log:
            log_dict = dict(log)
            # Parse sub-objects
            log_dict["travel"] = json.loads(log_dict["travel"]) if log_dict["travel"] else None
            log_dict["food"] = json.loads(log_dict["food"]) if log_dict["food"] else None
            log_dict["energy"] = json.loads(log_dict["energy"]) if log_dict["energy"] else None
            return log_dict
        return None

def save_log(user_id, date, log_type, details_data, emissions_contribution):
    """
    Saves or merges logs for a user on a given day.
    log_type is one of: 'travel', 'food', 'energy'
    """
    existing_log = get_log(user_id, date)
    created_at = datetime.datetime.utcnow().isoformat()
    
    # Setup initial structures
    travel = None
    food = None
    energy = None
    
    if existing_log:
        travel = existing_log.get("travel")
        food = existing_log.get("food")
        energy = existing_log.get("energy")
    
    # Overwrite the selected log type details
    if log_type == "travel":
        travel = details_data
    elif log_type == "food":
        food = details_data
    elif log_type == "energy":
        energy = details_data
        
    # Calculate new total emission
    total_emission = 0.0
    if travel and "emissions" in travel:
        total_emission += float(travel["emissions"])
    if food and "emissions" in food:
        total_emission += float(food["emissions"])
    if energy and "emissions" in energy:
        total_emission += float(energy["emissions"])
        
    # Standardize precision
    total_emission = round(total_emission, 2)
    
    if USE_FIREBASE:
        doc_id = f"{user_id}_{date}"
        log_data = {
            "userId": user_id,
            "date": date,
            "travel": travel,
            "food": food,
            "energy": energy,
            "totalEmission": total_emission,
            "createdAt": created_at
        }
        db_client.collection("logs").document(doc_id).set(log_data)
        return log_data
    else:
        conn = get_db_connection()
        # Upsert log using SQLite's INSERT OR REPLACE
        conn.execute(
            """
            INSERT INTO logs (userId, date, travel, food, energy, totalEmission, createdAt)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(userId, date) DO UPDATE SET
                travel = excluded.travel,
                food = excluded.food,
                energy = excluded.energy,
                totalEmission = excluded.totalEmission,
                createdAt = excluded.createdAt
            """,
            (
                user_id,
                date,
                json.dumps(travel) if travel else None,
                json.dumps(food) if food else None,
                json.dumps(energy) if energy else None,
                total_emission,
                created_at
            )
        )
        conn.commit()
        conn.close()
        return {
            "userId": user_id,
            "date": date,
            "travel": travel,
            "food": food,
            "energy": energy,
            "totalEmission": total_emission,
            "createdAt": created_at
        }

def get_logs_in_range(user_id, start_date, end_date):
    if USE_FIREBASE:
        # Range queries in Firestore require queries on date field
        docs = db_client.collection("logs")\
            .where("userId", "==", user_id)\
            .where("date", ">=", start_date)\
            .where("date", "<=", end_date)\
            .stream()
            
        logs_list = []
        for doc in docs:
            log_data = doc.to_dict()
            logs_list.append(log_data)
        # Sort manually by date
        logs_list.sort(key=lambda x: x["date"])
        return logs_list
    else:
        conn = get_db_connection()
        logs = conn.execute(
            "SELECT * FROM logs WHERE userId = ? AND date >= ? AND date <= ? ORDER BY date ASC",
            (user_id, start_date, end_date)
        ).fetchall()
        conn.close()
        
        logs_list = []
        for log in logs:
            log_dict = dict(log)
            log_dict["travel"] = json.loads(log_dict["travel"]) if log_dict["travel"] else None
            log_dict["food"] = json.loads(log_dict["food"]) if log_dict["food"] else None
            log_dict["energy"] = json.loads(log_dict["energy"]) if log_dict["energy"] else None
            logs_list.append(log_dict)
        return logs_list

# Suggestions DB Operations
def save_suggestions(user_id, date, recommendations):
    created_at = datetime.datetime.utcnow().isoformat()
    if USE_FIREBASE:
        doc_id = f"{user_id}_{date}"
        sugg_data = {
            "userId": user_id,
            "date": date,
            "recommendations": recommendations,
            "createdAt": created_at
        }
        db_client.collection("suggestions").document(doc_id).set(sugg_data)
        return sugg_data
    else:
        conn = get_db_connection()
        conn.execute(
            """
            INSERT INTO suggestions (userId, date, recommendations, createdAt)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(userId, date) DO UPDATE SET
                recommendations = excluded.recommendations,
                createdAt = excluded.createdAt
            """,
            (user_id, date, json.dumps(recommendations), created_at)
        )
        conn.commit()
        conn.close()
        return {
            "userId": user_id,
            "date": date,
            "recommendations": recommendations,
            "createdAt": created_at
        }

def get_suggestions(user_id, date):
    if USE_FIREBASE:
        doc_id = f"{user_id}_{date}"
        doc = db_client.collection("suggestions").document(doc_id).get()
        if doc.exists:
            return doc.to_dict()
        return None
    else:
        conn = get_db_connection()
        sugg = conn.execute("SELECT * FROM suggestions WHERE userId = ? AND date = ?", (user_id, date)).fetchone()
        conn.close()
        if sugg:
            sugg_dict = dict(sugg)
            sugg_dict["recommendations"] = json.loads(sugg_dict["recommendations"])
            return sugg_dict
        return None
