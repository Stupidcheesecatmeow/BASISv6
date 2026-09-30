<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/http.php';

try {

    $pdo = db();
    requireUser($pdo, ['ADMIN']);
    $action = $_GET['action'] ?? '';

    switch ($action) {

        case 'list':
            listUsers($pdo);
            break;

        case 'get':
            getUser($pdo);
            break;

        case 'create':
            createUser($pdo);
            break;

        case 'import':
            importUsers($pdo);
            break;

        case 'update':
            updateUser($pdo);
            break;

        case 'delete':
            deleteUser($pdo);
            break;

        case 'activities':
            getActivities($pdo);
            break;

        default:
            respond(false, 'Unknown action.', 400);
    }

} catch (Throwable $e) {

    respond(
        false,
        'Server error: ' . $e->getMessage(),
        500
    );
}


/* =========================================================
   LIST
========================================================= */

function listUsers(PDO $pdo): void
{
    $stmt = $pdo->query("
        SELECT
            id,
            control_number,
            name,
            email,
            role,
            status,
            municipality,
            barangay,
            profile_completed,
            created_at,
            updated_at
        FROM users
        ORDER BY id DESC
    ");

    respond(true, '', 200, [
        'users' => $stmt->fetchAll()
    ]);
}


/* =========================================================
   GET
========================================================= */

function getUser(PDO $pdo): void
{
    $input = input();

    $id = (int)($input['id'] ?? 0);

    if ($id <= 0) {
        respond(false, 'Invalid user ID.', 422);
    }

    $stmt = $pdo->prepare("
        SELECT *
        FROM users
        WHERE id = ?
        LIMIT 1
    ");

    $stmt->execute([$id]);

    $user = $stmt->fetch();

    if (!$user) {
        respond(false, 'User not found.', 404);
    }

    respond(true, '', 200, [
        'user' => publicUser($user, true)
    ]);
}


/* =========================================================
   CREATE
========================================================= */

function createUser(PDO $pdo): void
{
    $input = input();

    $name = clean($input['name'] ?? '');
    $email = strtolower(trim($input['email'] ?? ''));

    $role = normalizeRole($input['role'] ?? 'ISKOLAR');
    $status = normalizeStatus($input['status'] ?? 'ACTIVE');

    if ($name === '' || $email === '') {
        respond(false, 'Name and email are required.', 422);
    }

    validateEmail($email);

    if (emailExists($pdo, $email)) {
        respond(false, 'That email is already registered.', 409);
    }

    $password = generatePassword();

    $controlNumber = generateControlNumber($pdo);

    $stmt = $pdo->prepare("
        INSERT INTO users (
            control_number,
            name,
            email,
            password_hash,
            role,
            status,
            municipality,
            initial_password
        )
        VALUES (?, ?, ?, ?, ?, ?, 'BAGAC', ?)
    ");

    $stmt->execute([
        $controlNumber,
        $name,
        $email,
        password_hash($password, PASSWORD_DEFAULT),
        $role,
        $status,
        $password
    ]);

    $id = (int)$pdo->lastInsertId();

    $user = fetchUser($pdo, $id);

    respond(true, 'User created.', 201, [
        'user' => publicUser($user, true)
    ]);
}


/* =========================================================
   EXCEL IMPORT
========================================================= */

function importUsers(PDO $pdo): void
{
    $input = input();

    $rows = $input['rows'] ?? [];

    if (!is_array($rows) || count($rows) === 0) {
        respond(false, 'No Excel rows received.', 422);
    }

    $imported = 0;
    $skipped = 0;
    $errors = [];
    $credentials = [];

    $pdo->beginTransaction();

    try {

        foreach ($rows as $index => $row) {

            $excelRow = $index + 2;

            $name = clean($row['name'] ?? '');
            $email = strtolower(trim($row['email'] ?? ''));

            if ($name === '' || $email === '') {
                $skipped++;
                $errors[] = "Row {$excelRow}: NAME and EMAIL are required.";
                continue;
            }

            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $skipped++;
                $errors[] = "Row {$excelRow}: invalid email.";
                continue;
            }

            if (emailExists($pdo, $email)) {
                $skipped++;
                $errors[] = "Row {$excelRow}: {$email} already exists.";
                continue;
            }

            $password = generatePassword();
            $controlNumber = generateControlNumber($pdo);

            $stmt = $pdo->prepare("
                INSERT INTO users (
                    control_number,
                    name,
                    email,
                    password_hash,
                    role,
                    status,
                    municipality,
                    initial_password
                )
                VALUES (?, ?, ?, ?, 'ISKOLAR', 'ACTIVE', 'BAGAC', ?)
            ");

            $stmt->execute([
                $controlNumber,
                $name,
                $email,
                password_hash($password, PASSWORD_DEFAULT),
                $password
            ]);

            $id = (int)$pdo->lastInsertId();

            $imported++;

            $credentials[] = [
                'id' => $id,
                'control_number' => $controlNumber,
                'name' => $name,
                'email' => $email,
                'password' => $password
            ];
        }

        $pdo->commit();

    } catch (Throwable $e) {

        $pdo->rollBack();

        respond(
            false,
            'Import failed: ' . $e->getMessage(),
            500
        );
    }

    respond(true, 'Import complete.', 200, [
        'imported' => $imported,
        'skipped' => $skipped,
        'errors' => $errors,
        'credentials' => $credentials
    ]);
}


/* =========================================================
   UPDATE
========================================================= */

function updateUser(PDO $pdo): void
{
    $input = input();

    $id = (int)($input['id'] ?? 0);

    if ($id <= 0) {
        respond(false, 'Invalid user ID.', 422);
    }

    $existing = fetchUser($pdo, $id);

    if (!$existing) {
        respond(false, 'User not found.', 404);
    }

    $role = normalizeRole($input['role'] ?? $existing['role']);
    $status = normalizeStatus($input['status'] ?? $existing['status']);

    $fields = [
        'role' => $role,
        'status' => $status,

        'sex' => clean($input['sex'] ?? ''),
        'given_name' => clean($input['given_name'] ?? ''),
        'surname' => clean($input['surname'] ?? ''),
        'middle_name' => clean($input['middle_name'] ?? ''),
        'suffix' => clean($input['suffix'] ?? ''),

        'birthday' => clean($input['birthday'] ?? ''),
        'contact_no' => clean($input['contact_no'] ?? ''),
        'religion' => clean($input['religion'] ?? ''),

        'municipality' => clean($input['municipality'] ?? 'BAGAC'),
        'barangay' => clean($input['barangay'] ?? ''),

        'school' => clean($input['school'] ?? ''),
        'program' => clean($input['program'] ?? ''),
        'year_level' => clean($input['year_level'] ?? '')
    ];

    $fullName =
        trim(
            implode(
                ' ',
                array_filter([
                    $fields['given_name'],
                    $fields['middle_name'],
                    $fields['surname'],
                    $fields['suffix']
                ])
            )
        );

    if ($fullName !== '') {
        $fields['name'] = $fullName;
    }

    $fields['profile_completed'] =
        profileIsComplete($fields) ? 1 : 0;

    $fields['updated_at'] = date('Y-m-d H:i:s');

    $sets = [];
    $values = [];

    foreach ($fields as $column => $value) {
        $sets[] = "{$column} = ?";
        $values[] = $value;
    }

    $values[] = $id;

    $sql = "
        UPDATE users
        SET " . implode(', ', $sets) . "
        WHERE id = ?
    ";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($values);

    $user = fetchUser($pdo, $id);

    respond(true, 'User updated.', 200, [
        'user' => publicUser($user, true)
    ]);
}


/* =========================================================
   DELETE
========================================================= */

function deleteUser(PDO $pdo): void
{
    $input = input();

    $id = (int)($input['id'] ?? 0);

    if ($id <= 0) {
        respond(false, 'Invalid user ID.', 422);
    }

    $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
    $stmt->execute([$id]);

    if ($stmt->rowCount() === 0) {
        respond(false, 'User not found.', 404);
    }

    respond(true, 'User deleted.');
}


/* =========================================================
   ACTIVITIES
========================================================= */

function getActivities(PDO $pdo): void
{
    $input = input();

    $id = (int)($input['id'] ?? 0);

    if ($id <= 0) {
        respond(false, 'Invalid user ID.', 422);
    }

    /*
     * Uses the existing attendance table when available.
     * Your existing BASIS attendance table has:
     * activity_id, fullname, inb_number, attendance_date,
     * time_in, time_out.
     */

    $tableExists = $pdo->query("
        SELECT name
        FROM sqlite_master
        WHERE type='table'
        AND name='attendance'
    ")->fetch();

    if (!$tableExists) {
        respond(true, '', 200, ['activities' => []]);
    }

    $user = fetchUser($pdo, $id);

    if (!$user) {
        respond(false, 'User not found.', 404);
    }

    $stmt = $pdo->prepare("
        SELECT
            COALESCE(a.name, 'ACTIVITY') AS activity_title,
            att.time_in,
            att.time_out,
            '—' AS submission
        FROM activity_attendance att
        LEFT JOIN activities a
            ON a.id = att.activity_id
        WHERE att.user_id = ?
        ORDER BY att.attendance_date DESC, att.id DESC
    ");

    $stmt->execute([$id]);

    respond(true, '', 200, [
        'activities' => $stmt->fetchAll()
    ]);
}


/* =========================================================
   HELPERS
========================================================= */

function input(): array
{
    $raw = file_get_contents('php://input');

    if (!$raw) {
        return [];
    }

    $data = json_decode($raw, true);

    return is_array($data) ? $data : [];
}

function respond(
    bool $success,
    string $message = '',
    int $status = 200,
    array $extra = []
): never
{
    http_response_code($status);

    echo json_encode(
        array_merge(
            [
                'success' => $success,
                'message' => $message
            ],
            $extra
        ),
        JSON_UNESCAPED_UNICODE
    );

    exit;
}

function clean(string $value): string
{
    return trim(preg_replace('/\s+/', ' ', $value));
}

function validateEmail(string $email): void
{
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        respond(false, 'Invalid email address.', 422);
    }
}

function emailExists(PDO $pdo, string $email): bool
{
    $stmt = $pdo->prepare("
        SELECT id
        FROM users
        WHERE LOWER(email) = LOWER(?)
        LIMIT 1
    ");

    $stmt->execute([$email]);

    return (bool)$stmt->fetch();
}

function fetchUser(PDO $pdo, int $id): ?array
{
    $stmt = $pdo->prepare("
        SELECT *
        FROM users
        WHERE id = ?
        LIMIT 1
    ");

    $stmt->execute([$id]);

    $user = $stmt->fetch();

    return $user ?: null;
}

function publicUser(array $user, bool $withPassword = false): array
{
    unset($user['password_hash']);
    if (!$withPassword) {
        unset($user['initial_password']);
    }

    return $user;
}

function generatePassword(int $length = 10): string
{
    $characters =
        'ABCDEFGHJKLMNPQRSTUVWXYZ' .
        'abcdefghijkmnopqrstuvwxyz' .
        '23456789';

    $password = '';

    for ($i = 0; $i < $length; $i++) {
        $password .= $characters[random_int(0, strlen($characters) - 1)];
    }

    return $password;
}

function generateControlNumber(PDO $pdo): string
{
    $year = date('Y');
    $prefix = "BASIS-{$year}-";

    $stmt = $pdo->prepare("
        SELECT control_number
        FROM users
        WHERE control_number LIKE ?
        ORDER BY id DESC
        LIMIT 1
    ");

    $stmt->execute([$prefix . '%']);

    $last = $stmt->fetchColumn();

    $number = 1;

    if ($last) {

        $parts = explode('-', (string)$last);
        $lastNumber = (int)end($parts);

        if ($lastNumber > 0) {
            $number = $lastNumber + 1;
        }
    }

    do {
        $control = $prefix . str_pad((string)$number, 4, '0', STR_PAD_LEFT);

        $check = $pdo->prepare("
            SELECT id
            FROM users
            WHERE control_number = ?
        ");

        $check->execute([$control]);

        $exists = $check->fetchColumn();

        if ($exists) {
            $number++;
        }

    } while ($exists);

    return $control;
}

function normalizeRole(string $role): string
{
    $role = strtoupper(trim($role));

    return in_array(
        $role,
        ['ADMIN', 'REPRESENTATIVE', 'ISKOLAR'],
        true
    )
        ? $role
        : 'ISKOLAR';
}

function normalizeStatus(string $status): string
{
    $status = strtoupper(trim($status));

    return $status === 'INACTIVE'
        ? 'INACTIVE'
        : 'ACTIVE';
}

function profileIsComplete(array $data): bool
{
    $required = [
        'given_name',
        'surname',
        'birthday',
        'contact_no',
        'municipality',
        'barangay',
        'school',
        'program',
        'year_level'
    ];

    foreach ($required as $field) {
        if (trim((string)($data[$field] ?? '')) === '') {
            return false;
        }
    }

    return true;
}
