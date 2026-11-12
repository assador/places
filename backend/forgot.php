<?php
declare(strict_types=1);
error_reporting(E_ALL);
ini_set("display_errors", "0");

require_once __DIR__ . "/bootstrap.php";

apiRun($ctx, function () use ($ctx, $config) {
	$raw = file_get_contents("php://input");
	$data = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);

	if (!is_array($data)) {
		throw new ApiException(400, "invalid_request");
	}
	$email = $data["forgotEmail"] ?? null;
	if (!is_string($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
		throw new ApiException(400, "invalid_request");
	}

	$ctx->db->beginTransaction();

	$stmt = $ctx->db->prepare("
		SELECT `u`.`id`, `u`.`name`
		FROM `users` `u`
		WHERE `u`.`email` = :email
		FOR UPDATE
	");
	$stmt->execute([":email" => $email]);

	$user = $stmt->fetch(PDO::FETCH_ASSOC);
	if (!$user) {
		$ctx->db->commit();
		apiSuccess();
	}
	$userId = $user["id"];

	$stmt = $ctx->db->prepare("
		SELECT 1
		FROM `sessions`
		WHERE `userid` = :userid
			AND `reason` = 1
			AND `expiresat` > :now
		LIMIT 1
	");
	$stmt->execute([
		":userid" => $userId,
		":now"    => (int) (microtime(true) * 1000),
	]);

	if ($stmt->fetchColumn()) {
		$ctx->db->commit();
		apiSuccess();
	}
	$sessionUuid = createSession($ctx, $userId, [
		"lifetime" => 3600,
		"reason"   => 1,
	]);

	$ctx->db->commit();

	$htmlName = !empty($user["name"])
		? ", " . htmlspecialchars(
			$user["name"],
			ENT_QUOTES | ENT_SUBSTITUTE,
			"UTF-8"
		)
		: ""
	;
	$host = rtrim($config["host"], "/");
	$resetUrl = $host
		. "/backend/change_password.php?session="
		. rawurlencode($sessionUuid)
	;
	$htmlHost = htmlspecialchars(
		$host,
		ENT_QUOTES | ENT_SUBSTITUTE,
		"UTF-8"
	);
	$htmlResetUrl = htmlspecialchars(
		$resetUrl,
		ENT_QUOTES | ENT_SUBSTITUTE,
		"UTF-8"
	);

	$message = '<!doctype html>
<html lang="ru">
<head>
	<meta charset="utf-8">
	<title>Восстановление пароля пользователя сервиса «Места»</title>
</head>
<body>
	<h1>Восстановление пароля пользователя сервиса «Места»</h1>
	<p>Здравствуйте' . $htmlName . '!</p>
	<p>
		Ваш e-mail был указан для восстановления пароля пользователя
		<a href="' . $htmlHost . '">Персонального ГеоОрганайзера «Места»</a>.
	</p>
	<p>Если вы этого не делали, просто проигнорируйте это письмо.</p>
	<p>
		В противном случае для создания нового пароля вашего аккаунта
		перейдите по ссылке в течение часа:
		<a href="' . $htmlResetUrl . '">' . $htmlResetUrl . '</a>
	</p>
</body>
</html>';

	$cleanupSession = static function () use ($ctx, $sessionUuid, $userId): void {
		try {
			$sessionBin = uuidToBin($sessionUuid);
			if ($sessionBin === null || !deleteSession($ctx, $sessionBin, $userId)) {
				error_log("Failed to delete password reset session after mail failure");
			}
		} catch (Throwable $e) {
			error_log("Failed to clean up password reset session: " . (string) $e);
		}
	};
	try {
		$sent = sendMail(
			$email,
			"Восстановление пароля пользователя сервиса «Места»",
			$message,
			$config,
		);
	} catch (Throwable $e) {
		$cleanupSession();
		throw $e;
	}
	if (!$sent) {
		$cleanupSession();
		throw new ApiException(500, "mail_error");
	}

	apiSuccess();
});
