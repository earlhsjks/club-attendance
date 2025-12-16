from flask import Blueprint, render_template, redirect, url_for, session
from flask_login import login_required, current_user
from models import Event
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
@login_required
def dashboard():
    return render_template('dashboard.html')

@main_bp.route('/kiosk')
@login_required
def kiosk():
    return render_template('kiosk.html')

@main_bp.route('/settings')
@login_required
def settings():
    return render_template('data-management.html')

@main_bp.route('/event-details/<event_id>')
@login_required
def event_details(event_id):
    event = Event.query.filter(Event.id == event_id).first()
    date_simplified = event.date.strftime('%m-%d-%Y')

    return render_template('event-details.html', event=event, date_simplified=date_simplified)

@main_bp.route('/profile')
@login_required
def profle_page():
    return render_template('profile.html', current_user=current_user)

@main_bp.route('/attendance-records')
def attendance_records():
    return render_template('public-search.html')
