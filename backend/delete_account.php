<?php
include "config.php";
include "newpdo.php";
include "common.php";

$_POST = json_decode(file_get_contents("php://input"), true);
if(testAccountCheck($conn, $testaccountid, $_POST["userId"])) {
	echo 2; exit;
} else {
	// Delete, if neccessary, images as entries in DB and files.
	if(!($_POST["leavePlaces"] == "all" && $_POST["leaveImages"] == "all")) {
		$sqlpart = "
			FROM
				`places` `p`
				INNER JOIN
				`images` `i`
					ON `i`.`placeid` = `p`.`id`
					" . (
						$_POST["leavePlaces"] == "common" && $_POST["leaveImages"] != "none"
							? " AND `p`.`common` = 0"
							: ""
					) . "
					AND `p`.`userid` = '" . $_POST["userId"] . "'
		";
		$query = $conn->query("SELECT * " . $sqlpart);
		$result_images = $query->fetchAll(PDO::FETCH_ASSOC);
		foreach($result_images as $row) {
			unlink($dirs["uploads"]["images"]["big"] . $row["file"]);
			unlink($dirs["uploads"]["images"]["small"] . $row["file"]);
		}
		$query = $conn->query("DELETE `i` " . $sqlpart);
	}
	// Delete places or mark them as visible for another users.
	switch($_POST["leavePlaces"]) {
		case "none" :
			$result = $conn->exec("DELETE FROM `places` WHERE `userid` = '" . $_POST["userId"] . "'");
			break;
		case "common" :
			$result = $conn->exec("DELETE FROM `places` WHERE `userid` = '" . $_POST["userId"] . "' AND `common` = 0");
			break;
		case "all" :
			$result = $conn->exec("UPDATE `places` SET `common` = 1 WHERE `userid` = '" . $_POST["userId"] . "'");
			break;
		default :
			echo 0; exit;
	}
	$result = $conn->exec("DELETE FROM `folders` WHERE `userid` = '" . $_POST["userId"] . "'");
	$result = $conn->exec("DELETE FROM `usergroup` WHERE `user` = '" . $_POST["userId"] . "'");
	$result = $conn->exec("DELETE FROM `users` WHERE `id` = '" . $_POST["userId"] . "'");
	echo 1; exit;
}
