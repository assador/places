<?php
declare(strict_types=1);
error_reporting(E_ALL);
ini_set("display_errors", "0");

require_once __DIR__ . "/bootstrap.php";

header("Content-Type: text/html; charset=UTF-8");

$failure = '<!doctype html>
<html lang="ru">
<head>
	<meta charset="utf-8">
	<title>Сессия недействительна</title>
</head>
<body>
	<h1>Сессия недействительна или истекла</h1>
	<p>
		Возможно, прошёл отведённый срок подтверждения запроса,
		или в ссылке допущена ошибка.
	</p>
</body>
</html>
';

$error = '<!doctype html>
<html lang="ru">
<head>
	<meta charset="utf-8">
	<title>Ошибка</title>
</head>
<body>
	<h1>Ошибка</h1>
	<p>
		Попробуйте открыть ссылку ещё раз позже.
	</p>
</body>
</html>
';

$sessionId = $_GET["session"] ?? null;

if (!$sessionId) {
	http_response_code(403);
	echo $failure;
	exit;
}

$binSessionId = uuidToBin($sessionId);
$session = getSession($ctx, $binSessionId, 1);

if ($session === null) {
	http_response_code(403);
	echo $failure;
	exit;
}

$binUserId = $session["userid"];
$login = $session["login"];
$name = $session["name"];
$password = generateRandomString(8);

$htmlName = !empty($name)
	? ", " . htmlspecialchars($name, ENT_QUOTES | ENT_SUBSTITUTE, "UTF-8")
	: ""
;
$htmlLogin = htmlspecialchars(
	$login,
	ENT_QUOTES | ENT_SUBSTITUTE,
	"UTF-8"
);
$htmlHost = htmlspecialchars(
	rtrim($config["host"], "/"),
	ENT_QUOTES | ENT_SUBSTITUTE,
	"UTF-8"
);

$success = '<!doctype html>
<html lang="ru">
<head>
	<meta charset="utf-8">
	<title>Пароль изменён</title>
</head>
<body>
	<h1>Новый пароль создан</h1>
	<p>
		Здравствуйте' . $htmlName . '!
	</p>
	<p>
		Создан новый пароль для вашего аккаунта
		в <a href="' . $htmlHost . '">Персональном ГеоОрганайзере «Места»</a>.
	</p>
	<p>
		Ваш логин: ' . $htmlLogin . '<br />
		Ваш новый пароль: ' . $password . '
	</p>
	<p>
		Мы очень рекомендуем изменить его в личном кабинете после авторизации
		на более надёжный.
	</p>
</body>
</html>
';

try {
	$ctx->db->beginTransaction();

	$stmt = $ctx->db->prepare("
		UPDATE `users`
		SET `password` = :password
		WHERE `id` = :id
	");
	$stmt->bindValue(':id', $binUserId, PDO::PARAM_LOB);
	$stmt->bindValue(':password', password_hash($password, PASSWORD_DEFAULT));
	$stmt->execute();

	$isDeleted = deleteSession($ctx, $binSessionId, $binUserId);
	if (!$isDeleted) throw new RuntimeException("Failed to delete user session");

	$ctx->db->commit();

	echo $success;
}
catch (Throwable $e) {
	if ($ctx->db->inTransaction()) {
		$ctx->db->rollBack();
	}

	error_log((string) $e);

	http_response_code(500);
	echo $error;
}
