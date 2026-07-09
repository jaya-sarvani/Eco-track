import os
from dotenv import load_dotenv

# Load variables from .env if present
load_dotenv()

class Config:
    PORT = int(os.getenv("PORT", 5000))
    FLASK_ENV = os.getenv("FLASK_ENV", "development")
    SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-key-for-local-tokens")
    
    # External APIs
    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
    CARBON_INTERFACE_API_KEY = os.getenv("CARBON_INTERFACE_API_KEY", "")
    
    # Firebase configuration
    FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", "")
    FIREBASE_CLIENT_EMAIL = os.getenv("FIREBASE_CLIENT_EMAIL", "")
    FIREBASE_PRIVATE_KEY = os.getenv("FIREBASE_PRIVATE_KEY", "")
    
    # Determine if Firebase can be initialized
    # If private key contains escaped newlines, replace them
    if FIREBASE_PRIVATE_KEY:
        FIREBASE_PRIVATE_KEY = FIREBASE_PRIVATE_KEY.replace("\\n", "\n")
        
    USE_FIREBASE = True