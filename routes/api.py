from flask import Blueprint, request, jsonify
from datetime import datetime
from models import db, Event, Student, Attendance
from routes.main import auth_required
import csv, os, pytz

ph_time = datetime.now(pytz.timezone("Asia/Manila"))

api_bp = Blueprint('api', __name__)

@api_bp.route('/create-event', methods=['POST'])
@auth_required
def create_event():
    data = request.get_json()

    name = data.get('name')
    date = data.get('date')
    start = data.get('start_time')
    end = data.get('end_time')

    new_event = Event(
        name=name,
        date=date,
        start_time=start,
        end_time=end
    )

    try:
        db.session.add(new_event)
        db.session.commit()

        return jsonify({'success': True, 'message': 'Event created successfully!'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': f"Error creating event: {str(e)}"}), 500

@api_bp.route('/status')
@auth_required
def get_status():

    date = ph_time.strftime('%Y:%m:%d')
    now = ph_time.strftime('%H:%M:%S')

    active_event = Event.query.filter(
            Event.date == date,
            Event.start_time <= now,
            Event.end_time >= now
        ).first()
    
    if active_event:
        entries = Attendance.query.filter(Attendance.event_id == active_event.id).all()

        data = {
            'active': True,
            'name': active_event.name,
            'start': active_event.start_time.strftime("%I:%M %p"),
            'end': active_event.end_time.strftime("%I:%M %p"),
            'count': len(entries)
        }

        return jsonify(data), 200

    return jsonify({'active': False}), 200

def serfialize_events(e):
    return {
        'name': e.name,
        'date': e.date.strftime('%b %d, %Y'),
        'time': e.start_time.strftime('%I:%m %p'),
    }

@api_bp.route('/events')
@auth_required
def get_events():
    events  = Event.query.all()
    event_list = [serfialize_events(e) for e in events]

    return jsonify(event_list)

# IMPORT TO DB
def import_students_from_csv(csv_file):
    # Step 1: Read all student_ids from the new CSV
    with open(csv_file, newline='', encoding='latin-1') as file:
        reader = csv.DictReader(file)
        new_student_ids = set()
        rows = []
        for row in reader:
            student_id = row['student_id'].strip()
            if student_id:
                new_student_ids.add(student_id)
                rows.append(row)

    # Step 2: Delete attendance for students NOT in the new list
    Attendance.query.filter(~Attendance.student_id.in_(new_student_ids)).delete(synchronize_session=False)
    db.session.commit()

    # Step 3: Delete students NOT in the new list
    Student.query.filter(~Student.student_id.in_(new_student_ids)).delete(synchronize_session=False)
    db.session.commit()

    # Step 4: Update/add students from the new list
    for row in rows:
        student_id = row['student_id'].strip()
        student = Student.query.filter_by(student_id=student_id).first()
        if student:
            student.full_name = row['full_name'].strip()
            student.sex = row.get('sex', '').strip()
            student.course = row.get('course', '').strip()
            student.year = row.get('year', '').strip()
        else:
            student = Student(
                student_id=student_id,
                full_name=row['full_name'].strip(),
                sex=row.get('sex', '').strip(),
                course=row.get('course', '').strip(),
                year=row.get('year', '').strip()
            )
            db.session.add(student)
    db.session.commit()

@api_bp.route('/upload', methods=['POST'])
@auth_required
def upload_students_csv():
    if 'csv_file' not in request.files:
        return jsonify({'success': False, 'message': 'No file part'}), 400

    file = request.files['csv_file']

    if file.filename == '':
        return jsonify({'success': False, 'message': 'No selected file'}), 400

    try:
        # save uploaded file
        filepath = os.path.join('uploads', 'uploaded_students.csv')
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        file.save(filepath)

        # import CSV
        import_students_from_csv(filepath)

        return jsonify({'success': True, 'message': 'Students imported successfully!'}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500


def serfialize_students(e):
    return {
        'student_id': e.student_id,
        'full_name': e.full_name,
        'course': e.course,
        'year': e.year,
    }

@api_bp.route('/get-dm', methods=['GET'])
def get_data_management():
    students = Student.query.order_by(Student.full_name).all()
    total = len(students)

    student_list = [serfialize_students(s) for s in students]

    return jsonify({'students': student_list, 'total': total})

@api_bp.route('/scan', methods=['POST'])
@auth_required
def scan_student():
    date = ph_time.strftime('%Y:%m:%d')
    now = ph_time.strftime('%H:%M:%S')

    data = request.json
    student_id = data.get('student_id')
    
    active_event = Event.query.filter(
            Event.date == date,
            Event.start_time <= now,
            Event.end_time >= now
        ).first()
    
    if not active_event:
        return jsonify({
            'success': False, 
            'message': 'No event is currently active. Scan rejected.'
        }), 403

    existing_scan = Attendance.query.filter_by(
        student_id=student_id, 
        event_id=active_event.id
    ).first()
    
    if existing_scan:
        return jsonify({
            'success': False, 
            'message': 'Student already scanned.'
        }), 409

    # 3. Save the Scan
    new_log = Attendance(
        student_id=student_id,
        event_id=active_event.id,
        timestamp=ph_time.now()
        )
    db.session.add(new_log)
    db.session.commit()
    
    return jsonify({
        'success': True, 
        'message': f'Recorded: {student_id}',
        'student': student_id
    })

def serialize_attendance(a):
    return {
        'name': a.student.full_name,
        'student_id': a.student_id,
        'course': a.student.course,
        'year': a.student.year
    }

@api_bp.route('/attendees', methods=['GET'])
@auth_required
def get_attendees():
    date = ph_time.strftime('%Y:%m:%d')
    now = ph_time.strftime('%H:%M:%S')
    
    active_event = Event.query.filter(
            Event.date == date,
            Event.start_time <= now,
            Event.end_time >= now
        ).first()
    
    if active_event:
        attendance = Attendance.query.filter(Attendance.event_id==active_event.id).all()
        attendance_list = [serialize_attendance(a) for a in attendance]

        return jsonify({'students': attendance_list})
    
    return jsonify({'success': False, 'message': 'No records found.'})