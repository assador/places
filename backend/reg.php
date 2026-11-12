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
	$email = $data["regEmail"] ?? null;
	if (!is_string($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
		throw new ApiException(400, "invalid_request");
	}
	$login = $data["regLogin"] ?? null;
	$password  = $data["regPassword"] ?? null;
	if (
		!is_string($login) ||
		!is_string($password) ||
		$login === "" ||
		$password === ""
	) {
		throw new ApiException(400, "invalid_request");
	}
	$name = $data["regName"] ?? null;
	$phone = $data["regPhone"] ?? null;
	if (!is_string($name) || !is_string($phone)) {
		throw new ApiException(400, "invalid_request");
	}
	$name = trim($name) ?: null;
	$phone = trim($phone) ?: null;

	$confirmBefore = (int) (microtime(true) * 1000 + 86400000);
	$token = bin2hex(random_bytes(16));
	$userId = uuidv4(); 
	$binUserId = uuidToBin($userId);

	$ctx->db->beginTransaction();

	$query = $ctx->db->prepare("
		INSERT INTO `users` (
			`id`,
			`login`,
			`password`,
			`name`,
			`email`,
			`phone`,
			`confirmed`,
			`confirmbefore`,
			`token`,
			`lastupdates`
		) VALUES (
			:id,
			:login,
			:password,
			:name,
			:email,
			:phone,
			0,
			:confirmbefore,
			:token,
			:lastupdates
		)
	");
	$query->execute([
		":id"            => $binUserId,
		":login"         => $login,
		":password"      => password_hash($password, PASSWORD_DEFAULT),
		":name"          => $name,
		":email"         => $email,
		":phone"         => $phone,
		":confirmbefore" => $confirmBefore,
		":token"         => $token,
		":lastupdates"   => (int) (microtime(true) * 1000),
	]);

	$ctx->db->commit();

	$host = rtrim($config["host"], "/");
	$confirmUrl = $host . "/backend/confirm.php?token=" . rawurlencode($token);
	$htmlHost = htmlspecialchars(
		$host,
		ENT_QUOTES | ENT_SUBSTITUTE,
		"UTF-8"
	);
	$htmlConfirmUrl = htmlspecialchars(
		$confirmUrl,
		ENT_QUOTES | ENT_SUBSTITUTE,
		"UTF-8"
	);

	$message = '<!doctype html>
<html lang="ru">
<head>
	<meta charset="utf-8">
	<title>Подтверждение регистрации на сервисе «Места»</title>
</head>
<body>
	<h1>Подтверждение регистрации на сервисе «Места»</h1>
	<p>
		Ваш e-mail был указан при регистрации в
		<a href="' . $htmlHost . '">Персональном ГеоОрганайзере «Места»</a>.
		Если вы этого не делали, просто проигнорируйте это письмо.
	</p>
	<p>
		Для подтверждения регистрации на сервисе перейдите по ссылке:<br />
		<a href="' . $htmlConfirmUrl . '">' . $htmlConfirmUrl . '</a>
	</p>
</body>
</html>';

	$sent = sendMail(
		$email,
		"Подтверждение регистрации на сервисе «Места»",
		$message,
		$config,
	);
	if (!$sent) {
		throw new ApiException(500, "mail_error");
	}

	apiSuccess();
});
