<?php
require_once __DIR__ . '/bootstrap.php';

if(testAccountCheck($ctx, $config["testaccountuuid"], $_POST["userid"])) {
	echo 2; exit;
} else {
	switch ($_POST["need"]) {
		case "visiting" :
			$query = $ctx->db->query("
				SELECT `id`
				FROM `groups`
				WHERE `id`
				IN (
					SELECT `group`
					FROM `usergroup`
					WHERE `user` = :userid
				)
				AND `parent` = 'visiting'
			");
			$query->execute([
				":userid" => $_POST["userid"],
			]);
			$groups = $query->fetchAll(PDO::FETCH_COLUMN);
			break;
		default :
			$query = $ctx->db->query("
				SELECT *
				FROM `groups`
				WHERE `id`
				IN (
					SELECT `group`
					FROM `usergroup`
					WHERE `user` = :userid
				)
			");
			$query->execute([
				":userid" => $_POST["userid"],
			]);
			$groups = $query->fetchAll(PDO::FETCH_COLUMN);
			break;
	}
	echo json_encode(
		$groups,
		JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_NUMERIC_CHECK
	);
	exit;
}
