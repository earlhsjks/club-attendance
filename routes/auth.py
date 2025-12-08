from flask import Blueprint, request, session, redirect, url_for, jsonify
from dotenv import load_dotenv
import os

load_dotenv()

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    error = None
    if request.method == 'POST':
        pin = request.get_json()
        if pin == os.getenv('LOGIN_PIN'):
            session['logged_in'] = True
        else:
            return jsonify({'success': False, 'message': 'Incorrect PIN'}), 400

    return jsonify({'success': True, 'message': 'Logged-in'}), 200

@auth_bp.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))