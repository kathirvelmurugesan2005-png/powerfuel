<?php
 
session_start();
require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonOut(['success' => false, 'message' => 'Method not allowed'], 405);
}

$username = trim($_POST['username'] ?? '');
$email    = trim($_POST['email']    ?? '');
$password = trim($_POST['password'] ?? '');

 
if ($username === '' || $email === '' || $password === '') {
    jsonOut(['success' => false, 'message' => 'All fields are required.']);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonOut(['success' => false, 'message' => 'Invalid email address.']);
}
if (strlen($password) < 8) {
    jsonOut(['success' => false, 'message' => 'Password must be at least 8 characters.']);
}

try {
    $pdo = getDB();

     
    $check = $pdo->prepare('SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1');
    $check->execute([$username, $email]);
    if ($check->fetch()) {
        jsonOut(['success' => false, 'message' => 'Username or email already exists.']);
    }

    $hash = password_hash($password, PASSWORD_BCRYPT);
    $ins  = $pdo->prepare(
        'INSERT INTO users (username, email, password_hash, created_at) VALUES (?, ?, ?, NOW())'
    );
    $ins->execute([$username, $email, $hash]);

    $newId = $pdo->lastInsertId();
    $_SESSION['user_id']  = $newId;
    $_SESSION['username'] = $username;

    jsonOut(['success' => true, 'message' => 'Account created!', 'username' => $username]);
} catch (PDOException $e) {
    error_log('Register error: ' . $e->getMessage());
    jsonOut(['success' => false, 'message' => 'Server error. Please try again.'], 500);
}
