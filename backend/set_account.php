<?php
declare(strict_types=1);
error_reporting(E_ALL);
ini_set('display_errors', '1');

require_once __DIR__ . '/bootstrap.php';

$date = new DateTime();
$date->add(new DateInterval("P1D"));

$_POST = json_decode(file_get_contents("php://input"), true);
$idBin = uuidToBin($_POST["accountId"]);
if (testAccountCheck($ctx, $testaccountuuid, $_POST["accountId"])) {
	echo 2; exit;
} else {
	$query = $ctx->db->prepare("
		SELECT * FROM `users`
		WHERE `id` = :id
			AND `confirmed` = 1
	");
	$query->bindValue(':id', $idBin, PDO::PARAM_LOB);
	$query->execute();
	$result = $query->fetch(PDO::FETCH_ASSOC);
	if(!!$result) {
		$passwordchange =
			$_POST["accountNewPassword"] == "" ||
			password_verify($_POST["accountNewPassword"], $result["password"])
				? false : true;
	}
	if (
		count($result) == 0 ||
		$result["login" ] == $_POST["accountLogin" ] &&
		$result["name"  ] == $_POST["accountName"  ] &&
		$result["email" ] == $_POST["accountEmail" ] &&
		$result["phone" ] == $_POST["accountPhone" ] &&
		!$passwordchange
	) {
		echo 0; exit;
	}
	$currentuser = $result;
	if ($currentuser["login" ] != $_POST["accountLogin" ]) {
		$query = $ctx->db->prepare("
			SELECT `id` FROM `users`
			WHERE `login` = :login
		");
		$query->bindValue(':login', $_POST["accountLogin"], PDO::PARAM_LOB);
		$query->execute();
		$result = $query->fetch(PDO::FETCH_ASSOC);
		if(!!$result) {
			echo 3; exit;
		}
	}
	$query = $ctx->db->prepare("
		SELECT `id` FROM `userschange`
		WHERE `id` = :id
	");
	$query->bindValue(':id', $idBin, PDO::PARAM_LOB);
	$query->execute();
	$result = $query->fetch(PDO::FETCH_ASSOC);
	if (!!$result) {
		$query = $ctx->db->prepare("
			DELETE FROM `userschange`
			WHERE `id` = :id
		");
		$query->bindValue(':id', $idBin, PDO::PARAM_LOB);
		$result = $query->execute();
	}
	$token = generateRandomString(32);
	$query = $ctx->db->prepare("
		INSERT INTO `userschange` (
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
			:confirmed,
			:confirmbefore,
			:token
		)"
	);
	$query->bindValue(':id', $idBin, PDO::PARAM_LOB);
	$query->bindValue(':login', $_POST["accountLogin"]);
	$query->bindValue(':password', (
		$passwordchange
			? password_hash($_POST["accountNewPassword"], PASSWORD_DEFAULT)
			: $currentuser["password"]
	));
	$query->bindValue(':name', $_POST["accountName"]);
	$query->bindValue(':email', $_POST["accountEmail"]);
	$query->bindValue(':phone', $_POST["accountPhone"]);
	$query->bindValue(':confirmed', 0);
	$query->bindValue(':confirmbefore', $date->format("Y-m-d H:i:s"));
	$query->bindValue(':token', $token);
	$result = $query->execute();

	$message = '
		<html>
		<head>
			<title>Подтверждение изменения данных аккаунта в сервисе «Места»</title>
		</head>
		<body>
			<h1>Подтверждение изменения данных аккаунта в сервисе «Места»</h1>
			<p>
				Ваш e-mail был указан как e-mail пользователя Персонального ГеоОрганайзера «Места». Если это были вы,
				для подтверждения изменения данных аккаунта перейдите по ссылке:<br />
				<a href="' . $host . '/backend/confirmaccount.php?token=' . $token . '">
					' . $host . '/backend/confirmaccount.php?token=' . $token . '
				</a>
			</p>
		</body>
		</html>
	';
	$sent = sendMail(
		$_POST["accountEmail"],
		"Подтверждение изменения данных аккаунта в сервисе «Места»",
		$message,
		$config["mail"]
	);
	if (!$sent) {
		echo 0;
		exit;
	}
	echo 1;
	exit;
}
