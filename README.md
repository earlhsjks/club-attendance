# Club Attendance System

<!-- [![Ask DeepWiki](https://devin.ai/assets/askdeepwiki.png)](https://deepwiki.com/earlhsjks/club-attendance) -->

A comprehensive Flask-based web application designed to streamline and manage attendance for club events. It features a QR code scanning kiosk, robust data management, and a public portal for students to view their attendance records.

## Key Features

*   **Officer Dashboard**: A central hub to view active events, manage event history, and access quick actions.
*   **Event Management**: Schedule events with specific start and end times, defining the active window for attendance recording.
*   **Kiosk Mode**: Capture attendance in real-time using a device's camera to scan student ID QR codes or barcodes. Includes a manual entry option as a fallback.
*   **Student Data Management**: Import and manage the student master list by uploading a CSV file. The system automatically handles new and existing student records.
*   **Attendance Reporting**: Export detailed attendance lists for any completed event into a CSV format for documentation and analysis.
*   **Public Student Portal**: A dedicated page where students can enter their ID to view their personal attendance history across all events.
*   **System Auditing**: Logs important actions such as logins, data imports, and report exports for security and accountability.
*   **Secure Authentication**: A role-based login system ensures that only authorized officers can access the management dashboard and features.

## Technology Stack

*   **Backend**: Python, Flask, Flask-SQLAlchemy, Flask-Login, Flask-Migrate
*   **Database**: MySQL
*   **Frontend**: HTML, JavaScript, Tailwind CSS (via CDN)
*   **QR Code Scanning**: [html5-qrcode](https://github.com/mebjas/html5-qrcode) library

## Project Structure

The repository is organized to separate concerns, making it maintainable and scalable.

```
.
├── app.py                  # Main Flask application entry point
├── config.py               # Configuration for database, secret keys, etc.
├── models.py               # SQLAlchemy database models
├── requirements.txt        # Python dependencies
├── routes/                 # Flask Blueprints for routing
│   ├── api.py              # All API endpoints
│   ├── auth.py             # Authentication routes (login/logout)
│   └── main.py             # Core application view routes
├── static/                 # Frontend assets
│   ├── css/                # Custom CSS styles
│   ├── js/                 # JavaScript for each page/feature
│   └── sounds/             # Sound effects for UI feedback
└── templates/              # Jinja2 HTML templates
```

## Setup and Installation

Follow these steps to run the project locally.

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/earlhsjks/club-attendance.git
    cd club-attendance
    ```

2.  **Create and activate a virtual environment:**
    ```sh
    # For Windows
    python -m venv venv
    .\venv\Scripts\activate

    # For macOS/Linux
    python3 -m venv venv
    source venv/bin/activate
    ```

3.  **Install dependencies:**
    ```sh
    pip install -r requirements.txt
    ```

4.  **Configure Environment Variables:**
    Create a `.env` file in the root directory and add the following variables. Replace the placeholder values with your actual database credentials.

    ```env
    SECRET_KEY='your_strong_secret_key'
    DB_USER='your_db_user'
    DB_PASS='your_db_password'
    DB_HOST='localhost'
    DB_NAME='club_attendance_db'
    ```

5.  **Set up the Database:**
    Ensure you have a MySQL server running and create a database corresponding to `DB_NAME`. Then, initialize the database schema with Flask-Migrate.
    ```sh
    # One-time initialization
    flask db init

    # Create migration script and apply it
    flask db migrate -m "Initial migration."
    flask db upgrade
    ```
    *Note: You may need to create an initial user manually in the database or adapt the code to include a user creation script.*

6.  **Run the application:**
    ```sh
    flask run
    ```
    The application will be available at `http://127.0.0.1:5000`.

## License

This project is licensed under the MIT License. See the `LICENSE` file for more details.
