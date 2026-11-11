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
	if ($data["userid"] === $config["testaccountuuid"]) {
		throw new ApiException(403, "test_account");
	}

	$ctx->db->beginTransaction();

	$stmt = $ctx->db->prepare("
		UPDATE `users`
		SET `homeplace` = :homeplace
		WHERE `id` = :id
	");
	$stmt->bindValue(":id", $binUserId);
	$stmt->bindValue(":homeplace", $data["data"] == null ? null : uuidToBin($data["data"]));
	$stmt->execute();

	$ctx->db->commit();
	apiSuccess();
});
