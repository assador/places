<?php
declare(strict_types=1);
error_reporting(E_ALL);
ini_set('display_errors', '1');

function testAccountCheck(AppContext $ctx, $testaccountuuid, $uuid) {
	$query = $ctx->db->prepare("SELECT id FROM users WHERE id = :id");
	$query->bindValue(':id', uuidToBin($uuid), PDO::PARAM_LOB);
	$query->execute();
	$result = $query->fetch(PDO::FETCH_ASSOC);
	return (!!$result && $result["id"] === uuidToBin($testaccountuuid) ? true : false);
}
function passwordHashCheck(AppContext $ctx, string $id, string $password): bool {
	$query = $ctx->db->prepare("SELECT `password` FROM `users` WHERE `id` = :id LIMIT 1");
	$query->bindValue(':id', $id, PDO::PARAM_LOB);
	$query->execute();
	$result = $query->fetch(PDO::FETCH_ASSOC);
	if (!$result) {
		return false;
	}
	return password_verify($password, $result["password"]);
}
function generateRandomString($length = 32) {
	$characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
	$charactersLength = strlen($characters);
	$randomString = '';
	for ($i = 0; $i < $length; $i++) {
		$randomString .= $characters[rand(0, $charactersLength - 1)];
	}
	return $randomString;
}
function uuidv4(): string {
	$bin = random_bytes(16);
	$bin[6] = chr((ord($bin[6]) & 0x0f) | 0x40);
	$bin[8] = chr((ord($bin[8]) & 0x3f) | 0x80);
	return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($bin), 4));
}
function uuidToBin(?string $uuid): ?string {
	if (
		!is_string($uuid) || !preg_match(
			'/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i',
			$uuid
		)
	) {
		return null;
	}
	return hex2bin(str_replace('-', '', $uuid));
}
function binToUuid(?string $bin): ?string {
	if (!is_string($bin) || strlen($bin) !== 16) {
		return null;
	}
	$hex = bin2hex($bin);
	return sprintf(
		'%s-%s-%s-%s-%s',
		substr($hex, 0, 8),
		substr($hex, 8, 4),
		substr($hex, 12, 4),
		substr($hex, 16, 4),
		substr($hex, 20, 12)
	);
}
function createSession(AppContext $ctx, string $userIdBin, array $payload = []): string {
	/*
		$payload['reason'] === null  -- Ordinary session
		$payload['reason'] === 1     -- Forgot password
		$payload['lifetime']         -- Lifetime in seconds (default 86400)
	*/
	$defaults = [
		'lifetime' => 86400,
		'reason'   => null
	];
	$payload = array_merge($defaults, $payload);

	$sessionUuid = uuidv4();
	$sessionIdBin = uuidToBin($sessionUuid);

	$lifetime = (int)$payload['lifetime'];

	$query = $ctx->db->prepare("
		INSERT INTO `sessions` (`id`, `userid`, `expiresat`, `reason`)
		VALUES (
			:id,
			:userid,
			DATE_ADD(UTC_TIMESTAMP(), INTERVAL $lifetime SECOND),
			:reason
		)
	");
	$query->bindValue(':id', $sessionIdBin, PDO::PARAM_LOB);
	$query->bindValue(':userid', $userIdBin, PDO::PARAM_LOB);
	$query->bindValue(':reason', $payload['reason']);
	$query->execute();

	return $sessionUuid;
}
function deleteSession(AppContext $ctx, string $sessionIdBin, string $userIdBin): void {
	$query = $ctx->db->prepare("
		DELETE FROM `sessions`
		WHERE id = :id AND userid = :userid
	");
	$query->bindValue(':id', $sessionIdBin, PDO::PARAM_LOB);
	$query->bindValue(':userid', $userIdBin, PDO::PARAM_LOB);
	$query->execute();
}
function getSession(AppContext $ctx, string $sessionIdBin, $reason = null) {
	$query = $ctx->db->prepare("
		SELECT 
			s.userid, 
			u.login, 
			u.name, 
			u.email
		FROM `sessions` s
		JOIN `users` u ON u.id = s.userid
		WHERE s.id = :id
			AND s.reason <=> :reason
			AND (s.expiresat IS NULL OR s.expiresat > UTC_TIMESTAMP())
	");
	$query->bindValue(':id', $sessionIdBin, PDO::PARAM_LOB);
	$query->bindValue(':reason', $reason);
	$query->execute();

	return $query->fetch(PDO::FETCH_ASSOC) ?: null;
}
function sendMail($to, $subject, $message, $config) {
	$headers = "MIME-Version: 1.0\r\n";
	$headers .= "Content-type: text/html; charset=utf-8\r\n";
	$headers .= "From: =?utf-8?B?" .
		base64_encode($config["mail"]["name"])
			? base64_encode($config["mail"]["name"])
			: ""
	. "?= <{$config["mail"]["from"]}>";

	if (!empty($config["mail"]["smtp"])) {
		return sendMailSmtp($to, $subject, $message, $headers, $config);
	}
	if (@mail($to, $subject, $message, $headers)) {
		return true;
	}
	if (!empty($config["mail"]["logs"])) {
		if (!is_dir($config["mail"]["logs"])) {
			mkdir($config["mail"]["logs"], 0777, true);
		}
		$filename = $config["mail"]["logs"] . "/" . date("Y-m-d_H-i-s") . "_" . md5($to . $subject) . ".html";
		file_put_contents(
			$filename,
			"<h3>TO: {$to}</h3><h3>SUBJECT: {$subject}</h3>{$message}"
		);
		return true;
	}
	return false;
}
function sendMailSmtp($to, $subject, $message, $headers, $config) {
	$host = $config["host"];
	$port = $config["port"] ?? 587;
	$username = $config["username"] ?? null;
	$password = $config["password"] ?? null;
	$secure   = $config["secure"] ?? null;

	$remote = ($secure === "ssl" ? "ssl://" : "") . $host;
	$fp = fsockopen($remote, $port, $errno, $errstr, 30);
	if (!$fp) {
		return false;
	}
	$read = function($fp) {
		$data = "";
		while ($str = fgets($fp, 515)) {
			$data .= $str;
			if (substr($str, 3, 1) === " ") break;
		}
		return $data;
	};
	$write = function($fp, $cmd) use ($read) {
		fwrite($fp, $cmd . "\r\n");
		return $read($fp);
	};

	$read($fp);
	$write($fp, "EHLO " . $host);

	if ($secure === "tls") {
		$write($fp, "STARTTLS");
		if (!stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
			fclose($fp);
			return false;
		}
		$write($fp, "EHLO " . $host);
	}
	if ($username && $password) {
		$write($fp, "AUTH LOGIN");
		$write($fp, base64_encode($username));
		$write($fp, base64_encode($password));
	}

	$write($fp, "MAIL FROM:<{$config["mail"]["from"]}>");
	$write($fp, "RCPT TO:<{$to}>");
	$write($fp, "DATA");

	$data  = "Subject: {$subject}\r\n";
	$data .= $headers . "\r\n";
	$data .= $message . "\r\n.\r\n";

	fwrite($fp, $data);
	$read($fp);

	$write($fp, "QUIT");
	fclose($fp);

	return true;
}
