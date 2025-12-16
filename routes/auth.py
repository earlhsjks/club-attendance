from flask import Blueprint, request, session, redirect, url_for, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import check_password_hash
import os
from models import User
from  routes.api import systemLogEntry  

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'error': 'Invalid JSON'}), 400

    username = data.get('user')
    password = data.get('pass')

    if not username or not password:
        return jsonify({'success': False, 'error': 'Missing credentials'}), 400

    admin = User.query.filter_by(username=username).first()
    if not admin:
        return jsonify({'success': False, 'error': 'User not found'}), 404

    if not check_password_hash(admin.password, password):
        return jsonify({'success': False, 'error': 'Incorrect password'}), 401

    try:
        login_user(admin)

        # Log successful login
        systemLogEntry(
            action="Login",
            details=f"User '{admin.username}' logged in successfully"
        )

    except Exception as e:
        return jsonify({'success': False, 'error': f'Login failed: {str(e)}'}), 500

    return jsonify({'success': True, 'message': f'Welcome {admin.first_name}!'}), 200

@auth_bp.route('/logout', methods=['GET','POST'])
@login_required
def logout():
    logout_user()

    return redirect(url_for('index'))


# @auth_bp.route('/login', methods=['POST'])
# def login():
#     error = None
#     if request.method == 'POST':
#         pin = request.get_json()
#         if pin == os.getenv('LOGIN_PIN'):
#             session['logged_in'] = True
#         else:
#             return jsonify({'success': False, 'message': 'Incorrect PIN'}), 400

#     return jsonify({'success': True, 'message': 'Logged-in'}), 200

# @auth_bp.route('/logout')
# def logout():
#     session.clear()
#     return redirect(url_for('index'))