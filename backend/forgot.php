<?php
require_once __DIR__ . '/bootstrap.php';

$_POST = json_decode(file_get_contents("php://input"), true);

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
$query->bindValue(':email', $_POST["forgotEmail"]);
$query->execute();

$result = $query->fetch(PDO::FETCH_ASSOC);
if(!$result) {
	echo 2;
	exit;
}
$id = $result["id"];
$name = $result["name"];

$result["sessionuuid"] = createSession($ctx, $id, ['lifetime' => 3600, 'reason' => 1]);

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
			<a href="' . $host . '">сервиса просмотра и редактирования библиотек
			геометок «Места»</a>. Если вы этого не делали, просто проигнорируйте это письмо.
			В противном случае для создания нового пароля вашего аккаунта перейдите по ссылке: 
			<a href="' . $host . '/backend/change_password.php?session=' . $result["sessionuuid"] . '&reason=1">' . $host . '/backend/change_password.php?session=' . $result["sessionuuid"] . '&reason=1</a>
		</p>
	</body>
	</html>
';

$sent = sendMail(
	$_POST["forgotEmail"],
	"Восстановление пароля пользователя сервиса «Места»",
	$message,
	$config["mail"]
);
if (!$sent) {
	echo 1;
	exit;
}
