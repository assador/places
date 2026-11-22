<?php
declare(strict_types=1);
error_reporting(E_ALL);
ini_set("display_errors", "0");

require_once __DIR__ . "/bootstrap.php";

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

// SEC Transaction Voc recs

	if (!empty($list["usersvoc"])) {
		$deleteSql = "
			DELETE FROM `settings_users_voc`
			WHERE `id` = :id
		";
		$deleteStmt = $ctx->db->prepare($deleteSql);

		$insertSql = "
			INSERT INTO `settings_users_voc` (
				`id`, `groupid`, `type`, `baseval`, `name`, `description`, `public`, `srt`
			) VALUES (
				:id, :groupid, :type, :baseval, :name, :description, :public, :srt
			)
			ON DUPLICATE KEY UPDATE
				`groupid`     = VALUES(`groupid`),
				`type`        = VALUES(`type`),
				`baseval`     = VALUES(`baseval`),
				`name`        = VALUES(`name`),
				`description` = VALUES(`description`),
				`public`      = VALUES(`public`),
				`srt`         = VALUES(`srt`)
		";
		$insertStmt = $ctx->db->prepare($insertSql);

		$deleteEnumSql = "
			DELETE FROM `settings_users_voc_options`
			WHERE `settingid` = :settingid
		";
		$deleteEnumStmt = $ctx->db->prepare($deleteEnumSql);

		$insertEnumSql = "
			INSERT INTO `settings_users_voc_options` (
				`settingid`, `value`, `srt`, `enabled`, `extra`
			) VALUES (
				:settingid, :value, :srt, :enabled, :extra
			)
		";
		$insertEnumStmt = $ctx->db->prepare($insertEnumSql);

		foreach ($list["usersvoc"] as $row) {
			if (!empty($row["deleted"])) {
				$deleteStmt->execute([
					":id" => (int) $row["id"],
				]);
			} elseif (!empty($row["added"]) || !empty($row["updated"])) {
				$insertStmt->execute([
					":id"          => (int) $row["id"],
					":groupid"     => $row["groupid"] !== null ? (int) $row["groupid"] : null,
					":type"        => (int) $row["type"],
					":baseval"     => prepareSettingValue($row["baseval"], (int) $row["type"]),
					":name"        => $row["name"] ?? null,
					":description" => $row["description"] ?? null,
					":public"      => !empty($row["public"]) ? 1 : 0,
					":srt"         => (float) ($row["srt"] ?? 10),
				]);
				$deleteEnumStmt->execute([
					":settingid" => (int) $row["id"],
				]);
				if ((int) $row["type"] !== 0 && !empty($row["enum"]) && is_array($row["enum"])) {
					foreach ($row["enum"] as $enum) {
						$insertEnumStmt->execute([
							":settingid"   => (int) $row["id"],
							":value"       => prepareSettingValue($enum["val"], (int) $row["type"]),
							":srt"         => (float) ($enum["srt"] ?? 10),
							":enabled"     => !empty($enum["enabled"]) ? 1 : 0,
							":extra"       => isset($enum["extra"])
								? mb_strcut((string) $enum["extra"], 0, 255, "8bit")
								: null
							,
						]);
					}
				}
			}
		}
	}

	$ctx->db->commit();
	apiSuccess();
});
