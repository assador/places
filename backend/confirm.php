<?php
declare(strict_types=1);
error_reporting(E_ALL);
ini_set("display_errors", "0");

require_once __DIR__ . "/bootstrap.php";

header("Content-Type: text/html; charset=UTF-8");

$success = '<!doctype html>
<html lang="ru">
<head>
	<meta charset="utf-8">
	<title>Регистрация подтверждена</title>
</head>
<body>
	<h1>Успешно</h1>
	<p>
		Ваша регистрация успешно подтвержена. Теперь вы можете
		<a href="/auth">авторизоваться</a> на сервисе под своим логином.
	</p>
</body>
</html>
';

$failure = '<!doctype html>
<html lang="ru">
<head>
	<meta charset="utf-8">
	<title>Регистрация отклонена</title>
</head>
<body>
	<h1>Неуспешно</h1>
	<p>
		Токен недействителен.
		Возможно, прошёл отведённый срок подтверждения регистрации,
		или аккаунт уже активирован.
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
		Не удалось подтвердить регистрацию.
		Попробуйте открыть ссылку ещё раз позже.
	</p>
</body>
</html>
';

$token = $_GET["token"] ?? null;

if (!$token) {
	http_response_code(403);
	echo $failure;
	exit;
}

try {
	$ctx->db->beginTransaction();

	$stmt = $ctx->db->prepare("
		SELECT `id`
		FROM `users`
		WHERE `token` = :token
			AND `confirmed` = 0
		LIMIT 1
	");
	$stmt->execute([
		":token" => $token,
	]);

	$user = $stmt->fetch(PDO::FETCH_ASSOC);

	if ($user === false) {
		$ctx->db->rollBack();
		http_response_code(403);
		echo $failure;
		exit;
	}

	$stmt = $ctx->db->prepare("
		UPDATE `users`
		SET `confirmed` = 1
		WHERE `id` = :id
	");
	$stmt->execute([
		":id" => $user["id"],
	]);

	$stmt = $ctx->db->prepare("
		INSERT INTO `usergroup` (`user`, `group`, `enabled`)
		VALUES (:userid, 'beginners', 1)
	");
	$stmt->execute([
		":userid" => $user["id"],
	]);

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
