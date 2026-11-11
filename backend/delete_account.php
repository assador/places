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

	/*
	 * Collect image files before deleting database records.
	 * Images belonging to Places and Routes are removed by
	 * database cascades, so the files must be collected first.
	 */
	$stmt = $ctx->db->prepare("
		SELECT `file`
		FROM `images`
		WHERE `placeid` IN (
			SELECT `id`
			FROM `places`
			WHERE `userid` = :id
		)
		OR `routeid` IN (
			SELECT `id`
			FROM `routes`
			WHERE `userid` = :id
		)
	");
	$stmt->bindValue(":id", $binUserId, PDO::PARAM_LOB);
	$stmt->execute();
	$files = $stmt->fetchAll(PDO::FETCH_COLUMN);

	$ctx->db->beginTransaction();

	/*
	 * Groups survive account deletion.
	 * Only their ownership is removed.
	 */
	$stmt = $ctx->db->prepare("
		UPDATE `groups`
		SET `owner` = NULL
		WHERE `owner` = :id
	");
	$stmt->bindValue(":id", $binUserId, PDO::PARAM_LOB);
	$stmt->execute();

	/*
	 * Remove user-specific non-default settings.
	 */
	$stmt = $ctx->db->prepare("
		DELETE FROM `settings_users`
		WHERE `userid` = :id
	");
	$stmt->bindValue(":id", $binUserId, PDO::PARAM_LOB);
	$stmt->execute();

	/*
	 * Delete the user.
	 *
	 * Database cascades take care of the user’s Places, Routes,
	 * Folders, Sessions, Images, route-point relations, etc.
	 * Points themselves are deliberately left untouched.
	 */
	$stmt = $ctx->db->prepare("
		DELETE FROM `users`
		WHERE `id` = :id
	");
	$stmt->bindValue(":id", $binUserId, PDO::PARAM_LOB);
	$stmt->execute();

	if ($stmt->rowCount() !== 1) {
		throw new ApiException(404, "user_not_found");
	}

	$ctx->db->commit();

	/*
	 * Delete physical image files only after the database
	 * transaction has been successfully committed.
	 */
	foreach ($files as $file) {
		$big = $config["dirs"]["uploads"]["images"]["big"] . $file;
		$small = $config["dirs"]["uploads"]["images"]["small"] . $file;
		if (is_file($big)) unlink($big);
		if (is_file($small)) unlink($small);
	}

	apiSuccess();
});
