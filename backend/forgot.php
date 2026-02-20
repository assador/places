<?php
declare(strict_types=1);
error_reporting(E_ALL);
ini_set('display_errors', '1');

require_once __DIR__ . '/bootstrap.php';

$input = json_decode(
	file_get_contents("php://input"),
	true,
	512,
	JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
);

$query = $ctx->db->prepare("
	SELECT u.id, u.name
	FROM `users` u
	WHERE u.email = :email
		AND NOT EXISTS (
			SELECT 1
			FROM `sessions` s
			WHERE s.userid = u.id
				AND s.reason = 1
				AND s.expiresat > UTC_TIMESTAMP()
		);
");
$query->bindValue(':email', $input["forgotEmail"]);
$query->execute();

$result = $query->fetch(PDO::FETCH_ASSOC);
if(!$result) {
	echo 2;
	exit;
}
$id = $result["id"];
$name = $result["name"];
$sessionUuid = createSession($ctx, $id, [ 'lifetime' => 3600, 'reason' => 1 ]);

$message = '
	<html>
	<head>
		<title>Восстановление пароля пользователя сервиса «Места»</title>
	</head>
	<body>
		<h1>Восстановление пароля пользователя сервиса «Места»</h1>
		<p>
			Здравствуйте' . ($name != "" && $name != null ? ', ' . $name : '') . '!
		<p>
			Ваш e-mail был указан для восстановления пароля пользователя
			<a href="' . $config['host'] . '">Персонального ГеоОрганайзера «Места»</a>. Если вы этого не делали, просто проигнорируйте это письмо.
			В противном случае для создания нового пароля вашего аккаунта перейдите по ссылке: 
			<a href="' . $config['host'] . '/backend/change_password.php?session=' . $sessionUuid . '">' . $config['host'] . '/backend/change_password.php?session=' . $sessionUuid . '</a> в течение часа.
		</p>
	</body>
	</html>
';

$sent = sendMail(
	$input["forgotEmail"],
	"Восстановление пароля пользователя сервиса «Места»",
	$message,
	$config,
);
if (!$sent) {
	echo 1;
	exit;
}
