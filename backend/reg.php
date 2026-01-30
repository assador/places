<?php
declare(strict_types=1);
error_reporting(E_ALL);
ini_set('display_errors', '1');

require_once __DIR__ . '/bootstrap.php';

$date = new DateTime();
$date->add(new DateInterval("P1D"));

$_POST = json_decode(file_get_contents("php://input"), true);

$query = $ctx->db->prepare("
	SELECT `login`, `email`
	FROM `users`
	WHERE `login` = :login
		OR `email` = :email
");
$query->execute([
	":login" => $_POST["regLogin"],
	":email" => $_POST["regEmail"],
]);
$result = $query->fetch(PDO::FETCH_ASSOC);
if (!!$result) {echo 1; exit;}

$token = generateRandomString(32);
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
		`token`
	) VALUES (
		:id,
		:login,
		:password,
		:name,
		:email,
		:phone,
		0,
		:confirmbefore,
		:token
	)
");
$result = $query->execute([
	":id" => random_bytes(16),
	":login" => $_POST["regLogin"],
	":password" => password_hash($_POST["regPassword"], PASSWORD_DEFAULT),
	":name" => (!empty($_POST["regName"]) ? $_POST["regName"] : ""),
	":email" => $_POST["regEmail"],
	":phone" => (!empty($_POST["regPhone"]) ? $_POST["regPhone"] : ""),
	":confirmbefore" => $date->format("Y-m-d H:i:s"),
	":token" => $token,
]);

$message = '
	<html>
	<head>
		<title>Подтверждение регистрации в сервисе «Места»</title>
	</head>
	<body>
		<h1>Подтверждение регистрации в сервисе «Места»</h1>
		<p>
			Ваш e-mail был указан при регистрации в <a href="' . $host . '">
			Персональном ГеоОрганайзере «Места»</a>.
			Если вы этого не делали, просто проигнорируйте это письмо.
		</p>
		<p>
			Для подтверждения регистрации в сервисе перейдите по ссылке:<br />
			<a href="' . $host . '/backend/confirm.php?token=' . $token . '">
				' . $host . '/backend/confirm.php?token=' . $token . '
			</a>
		</p>
	</body>
	</html>
';
$sent = sendMail(
	$_POST["regEmail"],
	"Подтверждение регистрации в сервисе «Места»",
	$message,
	$config["mail"]
);
if (!$sent) {
	echo 0;
	exit;
}
