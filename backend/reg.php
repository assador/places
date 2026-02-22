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
$login = trim($input["regLogin"] ?? '');
$email = filter_var($input["regEmail"] ?? '', FILTER_VALIDATE_EMAIL);
$password  = $input["regPassword"] ?? '';

if (!$login || !$email || strlen($password) < 1) {
	http_response_code(400);
	echo json_encode([ 'error' => 'Invalid input' ]);
	exit;
}

$confirmBefore = (new DateTime())->add(new DateInterval("P1D"))->format("Y-m-d H:i:s");
$token = bin2hex(random_bytes(16));
$userId = uuidv4(); 
$userIdBin = uuidToBin($userId);

try {
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
			FLOOR(UNIX_TIMESTAMP(NOW(3)) * 1000)
		)
	");
	$query->execute([
		":id"            => $userIdBin,
		":login"         => $login,
		":password"      => password_hash($password, PASSWORD_DEFAULT),
		":name"          => trim($input["regName"] ?? ""),
		":email"         => $email,
		":phone"         => trim($input["regPhone"] ?? ""),
		":confirmbefore" => $confirmBefore,
		":token"         => $token,
	]);
} catch (PDOException $e) {
	if ($e->getCode() == 23000) {
		echo json_encode([ 'error' => 'User already exists' ]);
		exit;
	}
	throw $e;
}

$confirmUrl = $config['host'] . "/backend/confirm.php?token=" . $token;
$message = '
	<html>
	<head>
		<title>Подтверждение регистрации на сервисе «Места»</title>
	</head>
	<body>
		<h1>Подтверждение регистрации на сервисе «Места»</h1>
		<p>
			Ваш e-mail был указан при регистрации в <a href="' . $config['host'] . '">
			Персональном ГеоОрганайзере «Места»</a>.
			Если вы этого не делали, просто проигнорируйте это письмо.
		</p>
		<p>
			Для подтверждения регистрации на сервисе перейдите по ссылке:<br />
			<a href="' . $confirmUrl . '">' . $confirmUrl . '</a>
		</p>
	</body>
	</html>
';
$sent = sendMail(
	$email,
	"Подтверждение регистрации на сервисе «Места»",
	$message,
	$config,
);
echo json_encode([ 'success' => $sent ]);
