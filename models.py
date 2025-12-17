from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from sqlalchemy.sql import func
from werkzeug.security import generate_password_hash

db = SQLAlchemy()

class User(db.Model, UserMixin):
    __tablename__ = 'user'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    password = db.Column(db.String(200), nullable=False, default=generate_password_hash("admin123"))

class Student(db.Model):
    __tablename__ = 'student'

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.String(255), unique=True, nullable=False)
    full_name = db.Column(db.String(500), nullable=False)
    sex = db.Column(db.String(1))
    course = db.Column(db.String(255))
    year = db.Column(db.String(1))
    status = db.Column(db.Boolean, default=True)

    attendances = db.relationship(
        'Attendance',
        back_populates='student',
        cascade='all, delete-orphan'
    )


class Event(db.Model):
    __tablename__ = 'event'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time)
    end_time = db.Column(db.Time)

    attendances = db.relationship(
        'Attendance',
        back_populates='event',
        cascade='all, delete-orphan'
    )


class Attendance(db.Model):
    __tablename__ = 'attendance'

    id = db.Column(db.Integer, primary_key=True)

    event_id = db.Column(
        db.Integer,
        db.ForeignKey('event.id', ondelete='CASCADE'),
        nullable=False)

    student_id = db.Column(
        db.String(255),
        db.ForeignKey('student.student_id', ondelete='CASCADE'),
        nullable=False
    )

    course = db.Column(db.String(255))
    year = db.Column(db.String(10))
    timestamp = db.Column(db.DateTime)

    student = db.relationship('Student', back_populates='attendances')
    event = db.relationship('Event', back_populates='attendances')


class Logs(db.Model):
    __tablename__ = 'system_logs'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), index=True, nullable=True)
    action = db.Column(db.String(255), nullable=False)
    timestamp = db.Column(db.DateTime, server_default=func.now(), nullable=False)
    details = db.Column(db.Text)
    client_ip = db.Column(db.String(45))
