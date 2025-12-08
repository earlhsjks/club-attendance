from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Student(db.Model):
    __tablename__ = 'students'
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.String(255), unique=True)
    full_name = db.Column(db.String(500), nullable=False)
    sex = db.Column(db.String(1), nullable=True)
    course = db.Column(db.String(255), nullable=True)
    year = db.Column(db.String(10), nullable=True)

class Event(db.Model):
    __tablename__ = 'events'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255))
    date = db.Column(db.Date)
    start_time = db.Column(db.Time)
    end_time = db.Column(db.Time)

class Attendance(db.Model):
    __tablename__ = 'attendance'
    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('events.id'))
    student_id = db.Column(db.String(255), db.ForeignKey('students.student_id'), nullable=True)
    timestamp = db.Column(db.DateTime)

    student = db.relationship('Student', backref='attendances')
    event = db.relationship('Event', backref='attendances')