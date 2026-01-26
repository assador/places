<?php
declare(strict_types=1);
error_reporting(E_ALL);
ini_set('display_errors', '1');

require_once __DIR__ . '/bootstrap.php';

$_POST = json_decode(file_get_contents("php://input"), true);

$userIdBin = uuidToBin($_POST["userId"]);
if (testAccountCheck($ctx, $testaccountuuid, $_POST["userId"])) {
	echo 2; exit;
} else {
	// Delete, if neccessary, images as entries in DB and files.
	if (!($_POST["leavePlaces"] == "all" && $_POST["leaveImages"] == "all")) {
		$sqlpart = "
			FROM `places` `p`
			INNER JOIN `images` `i`
				ON `i`.`placeid` = `p`.`id`
				" . (
					$_POST["leavePlaces"] == "common" && $_POST["leaveImages"] != "none"
						? " AND `p`.`common` = 0"
						: ""
				) . "
				AND `p`.`userid` = :id
		";
		$query = $ctx->db->prepare("SELECT * " . $sqlpart);
		$query->bindValue(':id', $userIdBin, PDO::PARAM_LOB);
		$result = $query->execute();
		$result_images = $query->fetchAll(PDO::FETCH_ASSOC);
		foreach ($result_images as $row) {
			unlink($dirs["uploads"]["images"]["big"] . $row["file"]);
			unlink($dirs["uploads"]["images"]["small"] . $row["file"]);
		}
		$query = $ctx->db->prepare("DELETE `i` " . $sqlpart);
		$query->bindValue(':id', $userIdBin, PDO::PARAM_LOB);
		$result = $query->execute();
	}
	// Delete places or mark them as visible for another users.
	switch ($_POST["leavePlaces"]) {
		case "none" :
			$query = $ctx->db->prepare("
				DELETE FROM `places`
				WHERE `userid` = :id
			");
			$query->bindValue(':id', $userIdBin, PDO::PARAM_LOB);
			$result = $query->execute();
			break;
		case "common" :
			$query = $ctx->db->prepare("
				DELETE FROM `places`
				WHERE `userid` = :id
					AND `common` = 0
			");
			$query->bindValue(':id', $userIdBin, PDO::PARAM_LOB);
			$result = $query->execute();
			break;
		case "all" :
			$query = $ctx->db->prepare("
				UPDATE `places`
				SET `common` = 1
				WHERE `userid` = :id
			");
			$query->bindValue(':id', $userIdBin, PDO::PARAM_LOB);
			$result = $query->execute();
			break;
		default :
			echo 0; exit;
	}

	$query = $ctx->db->prepare("
		DELETE FROM `folders`
		WHERE `userid` = :id
	");
	$query->bindValue(':id', $userIdBin, PDO::PARAM_LOB);
	$result = $query->execute();

	$query = $ctx->db->prepare("
		DELETE FROM `usergroup`
		WHERE `user` = :id
	");
	$query->bindValue(':id', $userIdBin, PDO::PARAM_LOB);
	$result = $query->execute();

	$query = $ctx->db->prepare("
		DELETE FROM `users`
		WHERE `id` = :id
	");
	$query->bindValue(':id', $userIdBin, PDO::PARAM_LOB);
	$result = $query->execute();

	echo 1; exit;
}
