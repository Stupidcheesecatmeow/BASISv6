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
            cluster TEXT DEFAULT '',

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

    return $pdo;
}
