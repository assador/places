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
	<title>Данные успешно изменены</title>
</head>
<body>
	<h1>Успешно</h1>
	<p>
		Данные вашего аккаунта успешно изменены. Переавторизуйтесь на сервисе.
	</p>
</body>
</html>
';

$failure = '<!doctype html>
<html lang="ru">
<head>
	<meta charset="utf-8">
	<title>Не удалось внести изменения</title>
</head>
<body>
	<h1>Неуспешно</h1>
	<p>
		Данные вашего аккаунта не изменены. Возможно, прошёл отведённый
		для подтверждения изменений срок. Внесите изменения ещё раз.
	</p>
</body>
</html>
';

$error = '<!doctype html>
<html lang="ru">
<head>
	<meta charset="utf-8">
	<title>Не удалось внести изменения</title>
</head>
<body>
	<h1>Ошибка</h1>
	<p>
		Не удалось изменить данные аккаунта.
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
		SELECT * FROM `userschange`
		WHERE `token` = :token
		LIMIT 1
	");
	$stmt->execute([
		":token" => $token,
	]);

	$change = $stmt->fetch(PDO::FETCH_ASSOC);

	if ($change === false) {
		$ctx->db->rollBack();
		http_response_code(403);
		echo $failure;
		exit;
	}

	$stmt = $ctx->db->prepare("
		UPDATE `users`
		SET
			`login`    = :login,
			`password` = :password,
			`name`     = :name,
			`email`    = :email,
			`phone`    = :phone
		WHERE `id` = :id
	");
	$stmt->execute([
		":id"       => $change["id"],
		":login"    => $change["login"],
		":password" => $change["password"],
		":name"     => $change["name"],
		":email"    => $change["email"],
		":phone"    => $change["phone"],
	]);

	$stmt = $ctx->db->prepare("
		DELETE FROM `userschange`
		WHERE `token` = :token
	");
	$stmt->execute([
		":token" => $token,
	]);

	if ($stmt->rowCount() !== 1) {
		throw new RuntimeException("Failed to delete the user change request");
	}

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
