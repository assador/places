<?php
declare(strict_types=1);
error_reporting(E_ALL);
ini_set("display_errors", "0");

require_once __DIR__ . "/bootstrap.php";

apiRun($ctx, function () use ($ctx) {
	$raw = file_get_contents("php://input");
	$data = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
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

	$stmt = $ctx->db->query("SELECT * FROM `groups`");
	$stmt->execute();

	$result = [];

	while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
		$row["owner"] = binToUuid($row["owner"]);
		$row["system"] = (bool) $row["system"];
		$row["haschildren"] = (bool) $row["haschildren"];
		optionalizeStringFields($row, ['description']);
		$result[$row["id"]] = $row;
	}

	apiSuccess($result);
});
