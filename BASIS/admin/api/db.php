<?php
declare(strict_types=1);

/*
|--------------------------------------------------------------------------
| BASIS SQLite connection
|--------------------------------------------------------------------------
| Change DB_PATH only if your attendance.db is stored somewhere else.
*/

const DB_PATH = __DIR__ . '/../attendance.db';

function db(): PDO
{
    static $pdo = null;

    if ($pdo instanceof PDO) {
        return $pdo;
    }

    $pdo = new PDO('sqlite:' . DB_PATH);

    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    $pdo->exec('PRAGMA foreign_keys = ON');

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            control_number TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,

            role TEXT NOT NULL DEFAULT 'ISKOLAR',
            status TEXT NOT NULL DEFAULT 'ACTIVE',

            municipality TEXT DEFAULT 'BAGAC',
            barangay TEXT DEFAULT '',
            given_name TEXT DEFAULT '',
            surname TEXT DEFAULT '',
            middle_name TEXT DEFAULT '',
            suffix TEXT DEFAULT '',
            sex TEXT DEFAULT '',
            birthday TEXT DEFAULT '',
            contact_no TEXT DEFAULT '',
            religion TEXT DEFAULT '',

            school TEXT DEFAULT '',
            program TEXT DEFAULT '',
            year_level TEXT DEFAULT '',

            profile_completed INTEGER NOT NULL DEFAULT 0,

            initial_password TEXT DEFAULT '',

            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    ");

    $pdo->exec("CREATE TABLE IF NOT EXISTS auth_sessions (
        token_hash TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )");
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_auth_sessions_user ON auth_sessions(user_id)');

    $userColumns = $pdo->query('PRAGMA table_info(users)')->fetchAll(PDO::FETCH_COLUMN, 1);
    if (!in_array('must_change_password', $userColumns, true)) {
        $pdo->exec('ALTER TABLE users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0');
    }
    if (in_array('cluster', $userColumns, true)) {
        $pdo->exec('ALTER TABLE users DROP COLUMN cluster');
    }

    $pdo->exec("CREATE TABLE IF NOT EXISTS activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT '',
        activity_date TEXT NOT NULL DEFAULT '',
        start_time TEXT NOT NULL DEFAULT '',
        end_time TEXT NOT NULL DEFAULT '',
        venue TEXT NOT NULL DEFAULT '',
        venue_address TEXT NOT NULL DEFAULT '',
        generate_qr TEXT NOT NULL DEFAULT '',
        deadline_date TEXT NOT NULL DEFAULT '',
        deadline_time TEXT NOT NULL DEFAULT '',
        academic_year TEXT NOT NULL DEFAULT '',
        semester TEXT NOT NULL DEFAULT '',
        description TEXT NOT NULL DEFAULT '',
        municipality TEXT NOT NULL DEFAULT '',
        barangay TEXT NOT NULL DEFAULT '',
        created_by INTEGER,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(created_by) REFERENCES users(id) ON DELETE SET NULL
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        activity_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        submission_type TEXT NOT NULL DEFAULT 'attendance',
        file_name TEXT NOT NULL DEFAULT '',
        file_data TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'PENDING',
        submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(activity_id, user_id, submission_type),
        FOREIGN KEY(activity_id) REFERENCES activities(id) ON DELETE CASCADE,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS password_resets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token_hash TEXT NOT NULL UNIQUE,
        expires_at TEXT NOT NULL,
        used_at TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )");

    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_submissions_activity ON submissions(activity_id)');
    $pdo->exec("CREATE TABLE IF NOT EXISTS activity_attendance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        activity_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        attendance_date TEXT NOT NULL,
        time_in TEXT NOT NULL DEFAULT '',
        time_out TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'PRESENT',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(activity_id,user_id),
        FOREIGN KEY(activity_id) REFERENCES activities(id) ON DELETE CASCADE,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )");
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_activity_attendance_activity ON activity_attendance(activity_id)');
    $pdo->exec("CREATE TABLE IF NOT EXISTS activity_qr_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        activity_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        token TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(activity_id,user_id),
        FOREIGN KEY(activity_id) REFERENCES activities(id) ON DELETE CASCADE,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )");
    $pdo->exec("CREATE TABLE IF NOT EXISTS account_profiles (
        user_id INTEGER PRIMARY KEY,
        profile_json TEXT NOT NULL DEFAULT '{}',
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )");
    $pdo->exec("CREATE TABLE IF NOT EXISTS feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL DEFAULT 'Feedback',
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'NEW',
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    )");
    $pdo->exec('CREATE INDEX IF NOT EXISTS idx_feedback_user ON feedback(user_id,created_at)');

    return $pdo;
}
