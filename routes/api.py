from flask import Blueprint, request, jsonify, Response
from datetime import datetime
from models import db, Event, Student, Attendance
from routes.main import auth_required
import csv, os, pytz

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

    ph_time = datetime.now(pytz.timezone("Asia/Manila"))
    date = ph_time.date()
    current_time = ph_time.time().replace(microsecond=0)

    active_event = Event.query.filter(
        Event.date == date,
        Event.start_time <= current_time,
        Event.end_time >= current_time
    ).first()

    if active_event:
        entries = Attendance.query.filter(Attendance.event_id == active_event.id).all()

        data = {
            'active': True,
            'name': active_event.name,
            'start': active_event.start_time.strftime("%I:%M%p").lower(),
            'end': active_event.end_time.strftime("%I:%M%p").lower(),
            'count': len(entries),
            'debug': {
                'server': datetime.now().isoformat(),
                'local': ph_time.isoformat(),
                'start': active_event.start_time.strftime("%H:%M:%S"),
                'end': active_event.end_time.strftime("%H:%M:%S")
            }
        }


        return jsonify(data), 200

    return jsonify({'active': False, 'debug': {'server': datetime.now().isoformat(), 'local': ph_time.isoformat()}}), 200

def serfialize_events(e):
    return {
        'event_id': e.id,
        'name': e.name,
        'date': e.date.strftime('%b %d, %Y'),
        'date_simplified': e.date.strftime('%m-%d-%Y'),
        'time': e.start_time.strftime('%I:%M %p'),
        'present': len(Attendance.query.filter(Attendance.event_id==e.id).all())
    }

@api_bp.route('/events')
@auth_required
def get_events():
    events  = Event.query.order_by(Event.date.desc(), Event.start_time.desc()).all()
    event_list = [serfialize_events(e) for e in events]

    return jsonify(event_list)

@api_bp.route('/event-completed')
@auth_required
def get_event_completed():

    ph_time = datetime.now(pytz.timezone("Asia/Manila"))
    date = ph_time.date()
    current_time = ph_time.time().replace(microsecond=0)

    active_event = Event.query.filter(
        Event.date == date,
        Event.start_time <= current_time,
        Event.end_time >= current_time
    ).first()

    if active_event:
        events  = Event.query.filter(Event.id!=active_event.id).order_by(Event.date.desc(), Event.start_time.desc()).all()
        event_list = [serfialize_events(e) for e in events]

    if not active_event:
        events  = Event.query.order_by(Event.date.desc(), Event.start_time.desc()).all()
        event_list = [serfialize_events(e) for e in events]

    return jsonify(event_list)

# IMPORT TO DB
def import_students_from_csv(csv_file):
    # Step 1: Read all student_ids from the new CSV
    with open(csv_file, newline='', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        new_student_ids = set()
        rows = []

        for row in reader:
            student_id = row['student_id'].strip()
            if student_id:
                new_student_ids.add(student_id)
                rows.append(row)

    # Step 2: Mark students NOT in CSV as inactive
    Student.query.filter(
        ~Student.student_id.in_(new_student_ids)
    ).update(
        {Student.status: "inactive"},
        synchronize_session=False
    )

    # Step 3: Update existing students or insert new ones
    for row in rows:
        student_id = row['student_id'].strip()

        student = Student.query.filter_by(student_id=student_id).first()

        if student:
            student.full_name = row['full_name'].strip()
            student.sex = row.get('sex', '').strip()
            student.course = row.get('course', '').strip()
            student.year = row.get('year', '').strip()
            student.status = "active"
        else:
            student = Student(
                student_id=student_id,
                full_name=row['full_name'].strip(),
                sex=row.get('sex', '').strip(),
                course=row.get('course', '').strip(),
                year=row.get('year', '').strip(),
                status="active"
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
@auth_required
def get_data_management():
    students = Student.query.filter(Student.status=='active').order_by(Student.full_name).all()
    total = len(students)

    student_list = [serfialize_students(s) for s in students]

    return jsonify({'students': student_list, 'total': total})

@api_bp.route('/scan', methods=['POST'])
@auth_required
def scan_student():
    data = request.json
    student_id = data.get('student_id')
    
    ph_time = datetime.now(pytz.timezone("Asia/Manila"))
    date = ph_time.date()
    current_time = ph_time.time().replace(microsecond=0)

    active_event = Event.query.filter(
        Event.date == date,
        Event.start_time <= current_time,
        Event.end_time >= current_time
    ).first()
    
    check_student = Student.query.filter(Student.student_id==student_id).first()

    if not active_event:
        return jsonify({
            'success': False, 
            'message': 'No event is currently active. Scan rejected.'
        }), 403

    if not check_student:
        return jsonify({
            'success': False, 
            'message': 'Student record does not exist in the database.'
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
        course=check_student.course,
        year=check_student.year,
        timestamp=ph_time
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
        'year': a.student.year,
        'timestamp': a.timestamp.strftime("%I:%M%p").lower()
    }

@api_bp.route('/attendees', methods=['GET'])
@auth_required
def get_attendees():
    selected = request.args.get('selected')

    ph_time = datetime.now(pytz.timezone("Asia/Manila"))
    date = ph_time.date()
    current_time = ph_time.time().replace(microsecond=0)

    if selected:
        attendance = Attendance.query.filter(
            Attendance.event_id == selected
        ).all()

        event = Event.query.filter(Event.id == selected).first()
        
        return jsonify({
            'students': [serialize_attendance(a) for a in attendance],
            'total': len(attendance),
            'total': len(attendance),
            'time_start': event.start_time.strftime("%I:%M %p").lower()
        })


    active_event = Event.query.filter(
        Event.date == date,
        Event.start_time <= current_time,
        Event.end_time >= current_time
    ).first()

    if not active_event:
        return jsonify({'success': False, 'message': 'No active event found.'})

    attendance = Attendance.query.filter(
        Attendance.event_id == active_event.id
    ).all()

    return jsonify({
        'students': [serialize_attendance(a) for a in attendance]
    })

import csv
import io
from flask import Response, request

@api_bp.route('/export')
def export_csv():
    event_id = request.args.get('event_id', type=int)

    if not event_id:
        return {"error": "event_id is required"}, 400

    event = Event.query.get(event_id)
    if not event:
        return {"error": "Event not found"}, 404

    records = (
        db.session.query(Attendance, Student)
        .join(Student, Attendance.student_id == Student.student_id)
        .filter(Attendance.event_id == event_id)
        .all()
    )

    def generate():
        output = io.StringIO()
        writer = csv.writer(output)

        # header
        writer.writerow([
            "Student ID",
            "Full Name",
        ])

        for attendance, student in records:
            writer.writerow([
                student.student_id,
                student.full_name
            ])

        return output.getvalue()

    return Response(
        generate(),
        mimetype="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=attendance.csv"
        }
    )

@api_bp.route('/public/search')
def public_search():
    student_id = request.args.get('student_id', '').strip()

    student = Student.query.filter_by(
        student_id=student_id,
        status="active"
    ).first()

    if not student:
        return {"success": False, "error": "Student not found"}, 200

    events = Event.query.order_by(Event.date.desc()).all()

    attendance_map = {
        a.event_id: a
        for a in Attendance.query.filter_by(student_id=student.student_id).all()
    }

    attendance = []
    today = datetime.now(pytz.timezone("Asia/Manila")).date()

    for event in events:
        record = attendance_map.get(event.id)

        if record:
            attendance.append({
                "event": event.name,
                "date": event.date.strftime("%B %d, %Y"),
                "status": "Present",
                "time": record.timestamp.strftime("%I:%M %p") if record.timestamp else None
            })
        else:
            status = "Upcoming" if event.date > today else "Absent"
            attendance.append({
                "event": event.name,
                "date": event.date.strftime("%B %d, %Y"),
                "status": status,
                "time": None
            })

    return {
        "student": {
            "success": True,
            "student_id": student.student_id,
            "name": student.full_name,
            "course": student.course,
            "year": student.year
        },
        "attendance": attendance
    }
