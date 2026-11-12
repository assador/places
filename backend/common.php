<?php
declare(strict_types=1);
error_reporting(E_ALL);
ini_set("display_errors", "0");

function isValidSession(AppContext $ctx, ?string $binUserId, ?string $binSessionId): bool {
	if (empty($binUserId) || empty($binSessionId)) return false;
	$stmt = $ctx->db->prepare("
		SELECT 1 FROM `sessions`
		WHERE `id` = :sessionid AND `userid` = :userid
		LIMIT 1
	");
	$stmt->bindValue(":userid", $binUserId, PDO::PARAM_LOB);
	$stmt->bindValue(":sessionid", $binSessionId, PDO::PARAM_LOB);
	$stmt->execute();
	if (!$stmt->fetch()) return false;
	return true;
}
function userGroupsSatisfyConditions(AppContext $ctx, string $binUserId, array $conds): bool {
	if (empty($binUserId) || empty($conds)) return false;

	$sql = "
		SELECT `id`, `parent` FROM `groups`
		WHERE `id` IN (
			SELECT `group` FROM `usergroup`
			WHERE `user` = :user_id
		)
	";
	$params = [":user_id" => $binUserId];

	$paramIndex = 0; 
	$sqlBlocks = [];

	foreach ($conds as $group) {
		if (!is_array($group) || empty($group)) continue;

		$groupSqlParts = [];
		foreach ($group as $key => $val) {
			if (!is_string($val) && !is_bool($val)) continue; 
			$placeholder = ":" . $key . "_" . $paramIndex++;
			$groupSqlParts[] = "`$key` = $placeholder";
			$params[$placeholder] = is_bool($val) ? (int)$val : $val;
		}
		if (!empty($groupSqlParts)) {
			$sqlBlocks[] = "(" . implode(" OR ", $groupSqlParts) . ")";
		}
	}
	if (!empty($sqlBlocks)) $sql .= " AND " . implode(" AND ", $sqlBlocks);

	$stmt = $ctx->db->prepare($sql);
	$stmt->execute($params);
	return (bool) $stmt->fetch();
}
function passwordHashCheck(AppContext $ctx, string $id, string $password): bool {
	$query = $ctx->db->prepare("SELECT `password` FROM `users` WHERE `id` = :id LIMIT 1");
	$query->bindValue(':id', uuidToBin($id), PDO::PARAM_LOB);
	$query->execute();
	$result = $query->fetch(PDO::FETCH_ASSOC);
	if (!$result) return false;
	return password_verify($password, $result["password"]);
}
function optionalizeStringFields(array &$rec, array $keys): void {
	foreach ($keys as $key) {
		if (!is_string($rec[$key] ?? null)) {
			unset($rec[$key]);
		}
	}
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
function isUuid(string $uuid): bool {
	return (
		preg_match(
			'/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i',
			$uuid
		) === 1
	);
}
function uuidToBin(?string $uuid): ?string {
	if (
		!is_string($uuid) ||
		!preg_match(
			'/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i',
			$uuid
		)
	) {
		return null;
	}
	$bin = hex2bin(str_replace('-', '', $uuid));
	return $bin === false ? null : $bin;
}
function binToUuid(?string $bin): ?string {
	if (!is_string($bin) || strlen($bin) !== 16) {
		return null;
	}
	$hex = bin2hex($bin);
	return
		substr($hex, 0, 8) . '-' .
		substr($hex, 8, 4) . '-' .
		substr($hex, 12, 4) . '-' .
		substr($hex, 16, 4) . '-' .
		substr($hex, 20, 12)
	;
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

	$lifetime = (int) $payload['lifetime'];

	$query = $ctx->db->prepare("
		INSERT INTO `sessions` (`id`, `userid`, `createdat`, `expiresat`, `reason`)
		VALUES (
			:id,
			:userid,
			:createdat,
			:expiresat,
			:reason
		)
	");
	$query->bindValue(':id', $sessionIdBin, PDO::PARAM_LOB);
	$query->bindValue(':userid', $userIdBin, PDO::PARAM_LOB);
	$query->bindValue(':createdat', (int)(microtime(true) * 1000));
	$query->bindValue(':expiresat', (int)((microtime(true) + $lifetime) * 1000));
	$query->bindValue(':reason', $payload['reason']);
	$query->execute();

	return $sessionUuid;
}
function deleteSession(AppContext $ctx, string $sessionIdBin, string $userIdBin): bool {
	$query = $ctx->db->prepare("
		DELETE FROM `sessions`
		WHERE id = :id AND userid = :userid
	");
	$query->bindValue(':id', $sessionIdBin, PDO::PARAM_LOB);
	$query->bindValue(':userid', $userIdBin, PDO::PARAM_LOB);
	$query->execute();
	return $query->rowCount() === 1;
}
function getSession(AppContext $ctx, string $sessionIdBin, ?int $reason = null): ?array {
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
			AND (s.expiresat IS NULL OR s.expiresat > :now)
	");
	$query->bindValue(':id', $sessionIdBin, PDO::PARAM_LOB);
	$query->bindValue(':reason', $reason, $reason === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
	$query->bindValue(':now', (int)(microtime(true) * 1000));
	$query->execute();

	return $query->fetch(PDO::FETCH_ASSOC) ?: null;
}
function sendMail($to, $subject, $message, $config) {
	$encodedName = base64_encode($config["mail"]["name"]);
	$headers = implode("\r\n", [
		"MIME-Version: 1.0",
		"Content-type: text/html; charset=utf-8",
		"From: =?utf-8?B?"
			. base64_encode($config["mail"]["name"])
			. "?= <{$config["mail"]["from"]}>"
		,
		"Reply-To: <{$config["mail"]["from"]}>",
		"X-Mailer: PHP/" . phpversion(),
	]);
	if (!empty($config["mail"]["smtp"])) {
		return sendMailSmtp($to, $subject, $message, $headers, $config);
	}
	if (@mail($to, $subject, $message, $headers, "-f " . $config["mail"]["from"])) {
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
	$smtp = $config["mail"]["smtp"];

	$smtpHost = $smtp["host"];
    $port     = $smtp["port"] ?? 587;
    $username = $smtp["username"] ?? null;
    $password = $smtp["password"] ?? null;
    $secure   = $smtp["secure"] ?? null;

	$remote = ($secure === "ssl" ? "ssl://" : "") . $smtpHost;
	$fp = fsockopen($remote, $port, $errno, $errstr, 30);

	if (!$fp) {
		error_log("SMTP Connection Error: $errstr ($errno)");
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
	$write($fp, "EHLO " . $_SERVER['SERVER_NAME']);

	if ($secure === "tls") {
		$write($fp, "STARTTLS");
		if (!stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
			fclose($fp);
			return false;
		}
		$write($fp, "EHLO " . $config["host"]);
	}
	if ($username && $password) {
		$write($fp, "AUTH LOGIN");
		$write($fp, base64_encode($username));
		$write($fp, base64_encode($password));
	}

	$write($fp, "MAIL FROM:<{$config["mail"]["from"]}>");
	$write($fp, "RCPT TO:<{$to}>");
	$write($fp, "DATA");


	$data  = "Subject: =?utf-8?B?" . base64_encode($subject) . "?=\r\n";
	$data .= "To: <{$to}>\r\n";
	$data .= $headers . "\r\n";
	$data .= "\r\n";
	$data .= $message . "\r\n.\r\n";

	fwrite($fp, $data);
	$result = $read($fp);

	$write($fp, "QUIT");
	fclose($fp);

	return strpos($result, '250') !== false;
}
