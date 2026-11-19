<?php
declare(strict_types=1);
error_reporting(E_ALL);
ini_set("display_errors", "0");

require_once __DIR__ . "/bootstrap.php";

function prepareSettingValue(mixed $value, int $type): string {
	if ($value === null) return "";
	$rawString = match ($type) {
		0 => "",
		1 => $value ? "1" : "0",
		2 => (string) $value,
		3 => is_array($value) || is_object($value)
			? json_encode($value, JSON_UNESCAPED_UNICODE)
			: (string) $value
		,
		default => "",
	};
	return mb_strcut($rawString, 0, 255, "8bit");
}

apiRun($ctx, function () use ($ctx, $config) {
	$raw = file_get_contents("php://input");
	$data = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);

	$list = $data["data"] ?? [];
	if (empty($list)) apiSuccess();

	$binUserId = uuidToBin($data["userid"]);
	$binSessionId = uuidToBin($data["sessionid"]);

	if (!isValidSession($ctx, $binUserId, $binSessionId)) {
		throw new ApiException(401, "invalid_session");
	}
	if ($data["userid"] === $config["testaccountuuid"]) {
		throw new ApiException(403, "test_account");
	}

	$ctx->db->beginTransaction();

// SEC Transaction Groups
	
	if (!empty($list["groups"])) {
		$insertSql = "
			INSERT INTO `settings_groups` (
				`id`, `parent`, `name`, `description`, `srt`
			) VALUES (
				:id, :parent, :name, :description, :srt
			)
			ON DUPLICATE KEY UPDATE
				`parent`      = VALUES(`parent`),
				`name`        = VALUES(`name`),
				`description` = VALUES(`description`),
				`srt`         = VALUES(`srt`)
		";
		$insertStmt = $ctx->db->prepare($insertSql);
	
		$deleteSql = "
			DELETE FROM `settings_groups`
			WHERE `id` = :id
		";
		$deleteStmt = $ctx->db->prepare($deleteSql);
	
		foreach ($list["groups"] as $row) {
			if (!empty($row["deleted"])) {
				$deleteStmt->execute([
					":id"     => (int) $row["id"],
				]);
			} elseif (!empty($row["added"]) || !empty($row["updated"])) {
				$insertStmt->execute([
					":id"          => (int) $row["id"],
					":parent"      => $row["parent"] !== null ? (int) $row["parent"] : null,
					":name"        => $row["name"] ?? null,
					":description" => $row["description"] ?? null,
					":srt"         => (float) ($row["srt"] ?? 10),
				]);
			}
		}
	}

	$ctx->db->commit();
	apiSuccess();
});
