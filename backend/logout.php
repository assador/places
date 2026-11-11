<?php
declare(strict_types=1);
error_reporting(E_ALL);
ini_set("display_errors", "0");

require_once __DIR__ . "/bootstrap.php";

apiRun($ctx, function () use ($ctx) {
	$raw = file_get_contents("php://input");
	$data = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);

	if (empty($data["sessionid"]) || empty($data["userid"])) {
		throw new ApiException(401, "invalid_session");
	}

	$ctx->db->beginTransaction();
	deleteSession($ctx, uuidToBin($data["sessionid"]), uuidToBin($data["userid"]));
	$ctx->db->commit();
	apiSuccess();
});
