<?php
declare(strict_types=1);
error_reporting(E_ALL);
ini_set("display_errors", "0");

require_once __DIR__ . "/bootstrap.php";

apiRun($ctx, function () use ($ctx, $config) {
	$raw = file_get_contents("php://input");
	$data = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
	$binUserId = uuidToBin($data["userid"]);
	$binSessionId = uuidToBin($data["sessionid"]);

	if (!isValidSession($ctx, $binUserId, $binSessionId)) {
		throw new ApiException(401, "invalid_session");
	}

	$stmt = $ctx->db->prepare("
		SELECT `id`, `login`, `name`, `email`, `phone`, `homeplace`, `confirmed`
		FROM `users`
		WHERE `id` = :id
		LIMIT 1
	");
	$stmt->bindValue(":id", $binUserId, PDO::PARAM_LOB);
	$stmt->execute();

	$result = $stmt->fetch(PDO::FETCH_ASSOC);
	if (!$result) throw new ApiException(404, "wrong_account");

	$result["id"] = binToUuid($result["id"]);
	$result["homeplace"] = binToUuid($result["homeplace"]);
	$result["confirmed"] = (bool) $result["confirmed"];
	$result["testaccount"] = (bool) $result["id"] === $config["testaccountuuid"];
	$result["groups"] = [];

	$stmt = $ctx->db->prepare("
		SELECT * FROM `groups`
		WHERE `id` IN (
			SELECT `group` FROM `usergroup`
			WHERE `user` = :id
		)
	");
	$stmt->bindValue(":id", $binUserId, PDO::PARAM_LOB);
	$stmt->execute();
	while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
		$row["owner"] = binToUuid($row["owner"]);
		$row["system"] = (bool) $row["system"];
		$row["haschildren"] = (bool) $row["haschildren"];
		$result["groups"][$row["id"]] = $row;
	}

	apiSuccess($result);
});
