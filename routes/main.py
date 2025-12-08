from flask import Blueprint, render_template, redirect, url_for, session
from functools import wraps

main_bp = Blueprint('main', __name__)

def auth_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if not session.get('logged_in'):
            return redirect(url_for('index'))
        return f(*args, **kwargs)
    return wrapper

@main_bp.route('/dashboard')
@auth_required
def dashboard():
    return render_template('dashboard.html')

@main_bp.route('/kiosk')
@auth_required
def kiosk():
    return render_template('kiosk.html')

@main_bp.route('/settings')
@auth_required
def settings():
    return render_template('data-management.html')

@main_bp.route('/event-details')
@auth_required
def event_details():
    return render_template('event-details.html')

