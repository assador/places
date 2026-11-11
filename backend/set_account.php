<?php
declare(strict_types=1);
error_reporting(E_ALL);
ini_set("display_errors", "0");

require_once __DIR__ . "/bootstrap.php";

apiRun($ctx, function () use ($ctx, $config) {
	$raw = file_get_contents("php://input");
	$data = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);

	if (!isset($data["account"]) || !is_array($data["account"])) {
		throw new ApiException(400, "invalid_request");
	}

	$account = $data["account"];
	$binUserId = uuidToBin($data["userid"]);
	$binSessionId = uuidToBin($data["sessionid"]);

	if (!isValidSession($ctx, $binUserId, $binSessionId)) {
		throw new ApiException(401, "invalid_session");
	}
	if ($data["userid"] === $config["testaccountuuid"]) {
		throw new ApiException(403, "test_account");
	}

	$ctx->db->beginTransaction();

	$stmt = $ctx->db->prepare("
		SELECT * FROM `users`
		WHERE `id` = :id
			AND `confirmed` = 1
		LIMIT 1
	");
	$stmt->bindValue(":id", $binUserId, PDO::PARAM_LOB);
	$stmt->execute();

	$currentuser = $stmt->fetch(PDO::FETCH_ASSOC);

	if ($currentuser === false) {
		throw new ApiException(401, "invalid_session");
	}

	$loginchange = $currentuser["login"] !== $account["login"];
	$emailchange = $currentuser["email"] !== $account["email"];
	$namechange = $currentuser["name"] !== $account["name"];
	$phonechange = $currentuser["phone"] !== $account["phone"];

// SEC Check for another existing account

	if ($loginchange || $emailchange) {
		$stmt = $ctx->db->prepare("
			SELECT 1
			FROM `users`
			WHERE (`login` = :login OR `email` = :email)
				AND `id` <> :id
			LIMIT 1
		");
		$stmt->bindValue(':id', $binUserId, PDO::PARAM_LOB);
		$stmt->bindValue(':login', $account["login"]);
		$stmt->bindValue(':email', $account["email"]);
		$stmt->execute();

		if ($stmt->fetchColumn() !== false) {
			throw new ApiException(409, 'user_data_conflict');
		}
	}

// SEC Check for changes

	$passwordchange =
		isset($account["passwordnew"]) &&
		is_string($account["passwordnew"]) &&
		$account["passwordnew"] !== "" &&
		!password_verify($account["passwordnew"], $currentuser["password"])
	;
	if (!$loginchange && !$emailchange && !$namechange && !$phonechange && !$passwordchange) {
		throw new ApiException(418, "nothing_to_do");
	}

// SEC Make changes

	$stmt = $ctx->db->prepare("
		UPDATE `users`
		SET
			`login`       = :login,
			`password`    = :password,
			`name`        = :name,
			`email`       = :email,
			`phone`       = :phone,
			`lastupdates` = :lastupdates
		WHERE `id` = :id
	");

	$password = $passwordchange
		? password_hash($account["passwordnew"], PASSWORD_DEFAULT)
		: $currentuser["password"]
	;
	$stmt->bindValue(":id"          , $binUserId, PDO::PARAM_LOB);
	$stmt->bindValue(":login"       , $account["login"]);
	$stmt->bindValue(":password"    , $password);
	$stmt->bindValue(":name"        , $account["name"] ?? null);
	$stmt->bindValue(":email"       , $account["email"]);
	$stmt->bindValue(":phone"       , $account["phone"] ?? null);
	$stmt->bindValue(":lastupdates" , (int)(microtime(true) * 1000));

	$stmt->execute();

	$ctx->db->commit();
	apiSuccess();
});
