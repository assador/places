<?php
include "config.php";
include "newpdo.php";
include "common.php";
include "randomstring.php";

$date = new DateTime();
$date->add(new DateInterval("P1D"));

$_POST = json_decode(file_get_contents("php://input"), true);
if(testAccountCheck($conn, $testaccountid, $_POST["accountId"])) {
	echo 2; exit;
} else {
	$query = $conn->query("SELECT * FROM `users` WHERE `id` = '" . $_POST["accountId"] . "' AND `confirmed` = 1");
	$result = $query->fetchAll(PDO::FETCH_ASSOC);
	if(count($result) > 0) {
		$passwordchange =
			$_POST["accountNewPassword"] == "" ||
			password_verify($_POST["accountNewPassword"], $result[0]["password"])
				? false : true;
	}
	if(
		count($result) == 0 ||
		$result[0]["login" ] == $_POST["accountLogin" ] &&
		$result[0]["name"  ] == $_POST["accountName"  ] &&
		$result[0]["email" ] == $_POST["accountEmail" ] &&
		$result[0]["phone" ] == $_POST["accountPhone" ] &&
		!$passwordchange
	) {
		echo 0; exit;
	}
	$currentuser = $result[0];
	if($currentuser["login" ] != $_POST["accountLogin" ]) {
		$query = $conn->query("SELECT `id` FROM `users` WHERE `login` = '" . $_POST["accountLogin"] . "'");
		$result = $query->fetchAll(PDO::FETCH_ASSOC);
		if(count($result) > 0) {
			echo 3; exit;
		}
	}
	$query = $conn->query("SELECT `id` FROM `users_change` WHERE `id` = '" . $_POST["accountId"] . "'");
	$result = $query->fetchAll(PDO::FETCH_ASSOC);
	if(count($result) > 0) {
		$query = $conn->query("DELETE FROM `users_change` WHERE `id` = '" . $_POST["accountId"] . "'");
		$result = $query->execute();
	}
	$token = generateRandomString(32);
	$query = $conn->prepare(
		"INSERT INTO `users_change` (`id`, `login`, `password`, `name`, `email`, `phone`, `confirmed`, `confirmbefore`, `token`) VALUES ('" .
		$_POST["accountId"] .
		"', '" .
		$_POST["accountLogin"] .
		"', '" .
		($passwordchange
			? password_hash($_POST["accountNewPassword"], PASSWORD_DEFAULT)
			: $currentuser["password"]
		) .
		"', '" .
		$_POST["accountName"] .
		"', '" .
		$_POST["accountEmail"] .
		"', '" .
		$_POST["accountPhone"] .
		"', 0, '" .
		$date->format("Y-m-d H:i:s") .
		"', '" .
		$token .
		"')"
	);
	$result = $query->execute();
	
	$headers =
		"MIME-Version: 1.0" . "\r\n" .
		"Content-type: text/html; charset=utf-8" . "\r\n" .
		"From: =?utf-8?b?" . base64_encode("Сервис «Места»") . "?= <" . $from . ">"
	;
	$subject = "=?utf-8?b?" . base64_encode("Подтверждение изменения данных аккаунта в сервисе «Места»") . "?=";
	$message = '
		<html>
		<head>
			<title>Подтверждение изменения данных аккаунта в сервисе «Места»</title>
		</head>
		<body>
			<h1>Подтверждение изменения данных аккаунта в сервисе «Места»</h1>
			<p>
				Ваш e-mail был указан как e-mail пользователя сервиса просмотра
				и редактирования библиотек геометок «Места». Если это были вы,
				для подтверждения изменения данных аккаунта перейдите по ссылке:<br />
				<a href="' . $host . '/confirmaccount.php?token=' . $token . '">
					' . $host . '/confirmaccount.php?token=' . $token . '
				</a>
			</p>
		</body>
		</html>
	';
	mail($_POST["accountEmail"], $subject, $message, $headers);
	echo 1; exit;
}
