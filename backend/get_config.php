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
		SELECT `id` FROM `groups`
		WHERE `id`
		IN (
			SELECT `group`
			FROM `usergroup`
			WHERE `user` = :id
		)
		AND `parent` = 'visiting'
		LIMIT 1
	");
	$stmt->bindValue(':id', $binUserId, PDO::PARAM_LOB);
	$stmt->execute();
	$group = $stmt->fetch(PDO::FETCH_ASSOC);
	$groupId = $group["id"] ?? null;

	$result = [];
	foreach ($config["rights"] as $key => $value) {
		$result["rights"][$key] = $groupId !== null
			? ($config["rights"][$key][$groupId] ?? 0)
			: 0 // It looks like the account is not a member of any group at all.
		;
	}

	apiSuccess($result);
});
