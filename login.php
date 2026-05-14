<?php
 
session_start();
require_once 'db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonOut(['success' => false, 'message' => 'Method not allowed'], 405);
}

$username = trim($_POST['username'] ?? '');
$password = trim($_POST['password'] ?? '');

if ($username === '' || $password === '') {
    jsonOut(['success' => false, 'message' => 'Username and password are required.']);
}

try {
    $pdo  = getDB();
    $stmt = $pdo->prepare('SELECT id, username, password_hash FROM users WHERE username = ? LIMIT 1');
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password_hash'])) {
        $_SESSION['user_id']  = $user['id'];
        $_SESSION['username'] = $user['username'];

         
        $pdo->prepare('UPDATE users SET last_login = NOW() WHERE id = ?')
            ->execute([$user['id']]);

        jsonOut(['success' => true, 'username' => $user['username']]);
    } else {
        jsonOut(['success' => false, 'message' => 'Invalid username or password.']);
    }
} catch (PDOException $e) {
    error_log('Login error: ' . $e->getMessage());
    jsonOut(['success' => false, 'message' => 'Server error. Please try again.'], 500);
}
