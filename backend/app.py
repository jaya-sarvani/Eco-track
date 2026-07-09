import logging
from flask import Flask, jsonify
from flask_cors import CORS
from config.config import Config
from models.db import db_init

# Blueprints
from routes.auth import auth_bp
from routes.logs import logs_bp
from routes.dashboard import dashboard_bp
from routes.history import history_bp
from routes.suggestions import suggestions_bp
from routes.report import report_bp
from routes.badges import badges_bp

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger(__name__)


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # CORS Configuration
    CORS(app, supports_credentials=True)

    db_init()

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(logs_bp, url_prefix="/api/logs")
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")
    app.register_blueprint(history_bp, url_prefix="/api/history")
    app.register_blueprint(suggestions_bp, url_prefix="/api/suggestions")
    app.register_blueprint(report_bp, url_prefix="/api/report")
    app.register_blueprint(badges_bp, url_prefix="/api/badges")

    @app.route("/", methods=["GET"])
    def home():
        return jsonify({
            "status": "online",
            "message": "EcoTrack API is running smoothly",
            "databaseMode": "Firebase Firestore" if Config.USE_FIREBASE else "Local SQLite Fallback",
        }), 200

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Resource not found"}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"error": "Internal server error occurred"}), 500

    return app


if __name__ == "__main__":
    app = create_app()
    port = Config.PORT

    logger.info("EcoTrack API Server starting on port %d...", port)
    logger.info(
        "Mode: %s",
        "Firebase Firestore + Firebase Auth"
        if Config.USE_FIREBASE
        else "Local SQLite + Local JWT Fallback"
    )

    app.run(
        host="0.0.0.0",
        port=port,
        debug=Config.FLASK_ENV == "development"
    )