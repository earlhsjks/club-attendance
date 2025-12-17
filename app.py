from flask import Flask, render_template, redirect, url_for, request, jsonify
from flask_session import Session
from flask_migrate import Migrate
from flask_login import LoginManager, UserMixin, login_user, logout_user, current_user, login_required
from datetime import timedelta
import os, logging
from werkzeug.security import check_password_hash, generate_password_hash

from routes.auth import auth_bp
from routes.main import main_bp
from routes.api import api_bp
from config import Config
from models import db, User  # Make sure your User model inherits from db.Model and UserMixin

logging.basicConfig(level=logging.INFO)

app = Flask(__name__)
app.config.from_object(Config)

# Session setup
os.makedirs("./flask_session", exist_ok=True)
app.config['SESSION_TYPE'] = 'filesystem'
app.config['SESSION_PERMANENT'] = True
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(minutes=30)
app.config['SESSION_FILE_DIR'] = "./flask_session"
Session(app)

# Database setup
db.init_app(app)
migrate = Migrate(app, db)

# Flask-Login setup
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'index' 

# Register Blueprints
app.register_blueprint(auth_bp, url_prefix='/auth')
app.register_blueprint(main_bp)
app.register_blueprint(api_bp, url_prefix='/api')

# User loader
@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

# Home route
@app.route('/')
def index():
    if current_user.is_authenticated:
        return redirect(url_for('main.dashboard'))
    return render_template('auth.html')


# Example logout route
@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))


# Initialize database (optional)
def initialize_database():
    with app.app_context():
        db.create_all()


if __name__ == '__main__':
    # initialize_database()  # uncomment to create tables
    app.run(host="0.0.0.0", debug=True)
