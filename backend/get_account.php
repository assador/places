<?php
include "config.php";
include "newpdo.php";

$query = $conn->query("SELECT * FROM `users` WHERE `id` = '" . $_GET["id"] . "'");
$result = $query->fetchAll(PDO::FETCH_ASSOC);
if(count($result) == 0) {
	echo 0;
} else {
	$result[0]["testaccount"] = $result[0]["id"] == $testaccountid ? true : false;
	$query = $conn->query("
		SELECT * FROM `usergroup`
		INNER JOIN `groups` ON `usergroup`.`group` = `groups`.`id`
		WHERE `user` = '" . $_GET["id"] . "'
	");
	$groups = $query->fetchAll(PDO::FETCH_ASSOC);
	$result[0]["groups"] = [];
	foreach	($groups as $key => $value) {
		$result[0]["groups"][] = array(
			"group"  => $value["group"],
			"parent" => $value["parent"]
		);
	}
	echo json_encode($result[0], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}
