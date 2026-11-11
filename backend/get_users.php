<?php
declare(strict_types=1);
error_reporting(E_ALL);
ini_set("display_errors", "0");

require_once __DIR__ . "/bootstrap.php";

apiRun($ctx, function () use ($ctx) {
	$raw = file_get_contents("php://input");
	$data = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
	$users = $data["users"];
	$binUserId = uuidToBin($data["userid"]);
	$binSessionId = uuidToBin($data["sessionid"]);

	if (!isValidSession($ctx, $binUserId, $binSessionId)) {
		throw new ApiException(401, "invalid_session");
	}
	if (!userGroupsSatisfyConditions($ctx, $binUserId, [[
			"id" => "superusers",
			"parent" => "management",
		]])
	) {
		throw new ApiException(403, "insufficient_permissions");
	}

	$ctx->db->beginTransaction();

	$result = [];

	if (!empty($users) && is_array($users)) {
		$ids = array_map("uuidToBin", $data["users"]);
		$in  = implode(",", array_fill(0, count($ids), "?"));
		$stmt = $ctx->db->prepare("
			SELECT `id`, `login`, `name` FROM `users`
			WHERE `id` IN ($in)
		");
		foreach ($ids as $i => $bin) {
			$stmt->bindValue($i + 1, $bin, PDO::PARAM_LOB);
		}
		$stmt->execute();
/*
		$result = $stmt->fetchAll(PDO::FETCH_ASSOC);
		foreach ($result as &$row) {
			$row["id"] = binToUuid($row["id"]);
		}
*/
	} else {
		$stmt = $ctx->db->query("
			SELECT
				`id`,
				`login`,
				`confirmed`,
				`homeplace`,
				`name`,
				`email`,
				`phone`,
				`lastupdates`,
				`confirmbefore`
			FROM `users`
		");
		$stmt->execute();
	}
	while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
		$row["id"] = binToUuid($row["id"]);
		$row["homeplace"] = binToUuid($row["homeplace"]);
		$row["confirmed"] = (bool) $row["confirmed"];
		optionalizeStringFields($row, ['name', 'email', 'phone']);
		$result[$row["id"]] = $row;
	}

	$ctx->db->commit();
	apiSuccess($result);
});
