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

$date = new DateTime();
$date->add(new DateInterval("P1D"));

$idBin = uuidToBin($input["accountId"]);
if (testAccountCheck($ctx, $config["testaccountuuid"], $input["accountId"])) {
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
			$input["accountNewPassword"] == "" ||
			password_verify($input["accountNewPassword"], $result["password"])
				? false : true;
	}
	if (
		count($result) == 0 ||
		$result["login" ] == $input["accountLogin" ] &&
		$result["name"  ] == $input["accountName"  ] &&
		$result["email" ] == $input["accountEmail" ] &&
		$result["phone" ] == $input["accountPhone" ] &&
		!$passwordchange
	) {
		echo 0; exit;
	}
	$currentuser = $result;
	if ($currentuser["login" ] != $input["accountLogin" ]) {
		$query = $ctx->db->prepare("
			SELECT `id` FROM `users`
			WHERE `login` = :login
		");
		$query->bindValue(':login', $input["accountLogin"], PDO::PARAM_LOB);
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
	$query->bindValue(':login', $input["accountLogin"]);
	$query->bindValue(':password', (
		$passwordchange
			? password_hash($input["accountNewPassword"], PASSWORD_DEFAULT)
			: $currentuser["password"]
	));
	$query->bindValue(':name', $input["accountName"]);
	$query->bindValue(':email', $input["accountEmail"]);
	$query->bindValue(':phone', $input["accountPhone"]);
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
				<a href="' . $config['host'] . '/backend/confirmaccount.php?token=' . $token . '">
					' . $config['host'] . '/backend/confirmaccount.php?token=' . $token . '
				</a>
			</p>
		</body>
		</html>
	';
	$sent = sendMail(
		$input["accountEmail"],
		"Подтверждение изменения данных аккаунта в сервисе «Места»",
		$message,
		$config,
	);
	if (!$sent) {
		echo 0;
		exit;
	}
	echo 1;
	exit;
}
