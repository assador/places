<?php
include "config.php";
include "newpdo.php";
include "common.php";

if(testAccountCheck($conn, $testaccountid, $_POST["userid"])) {
	echo 2; exit;
} else {
	switch($_POST["need"]) {
		case "visiting" :
			$query = $conn->query("
				SELECT `id`
				FROM `groups`
				WHERE `id`
				IN (
					SELECT `group`
					FROM `usergroup`
					WHERE `user` = '" . $_POST["userid"] . "'
				)
				AND `parent` = 'visiting'
			");
			$result = $query->fetch(PDO::FETCH_ASSOC);
			echo $result["id"];
			break;
		default :
			$query = $conn->query("
				SELECT *
				FROM `groups`
				WHERE `id`
				IN (
					SELECT `group`
					FROM `usergroup`
					WHERE `user` = '" . $_POST["userid"] . "'
				)
			");
			$result = $query->fetchAll(PDO::FETCH_ASSOC);
			echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_NUMERIC_CHECK);
	}
	exit;
}
