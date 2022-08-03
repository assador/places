<?php
include "config.php";
include "newpdo.php";

$query = $conn->query("SET FOREIGN_KEY_CHECKS = 0");
$query->execute();

$query = $conn->query("
	SELECT `w`.`id`
	FROM `waypoints` `w`
");
$waypoints = $query->fetchAll(PDO::FETCH_ASSOC);

$all_with_waypoint_id = [];
$orphaned_waypoints_ids = [];
foreach ($waypoints as $waypoint) {
	$query = $conn->query("
		SELECT `p`.`id`
		FROM `places` `p`
		WHERE `p`.`waypoint` = '" . $waypoint["id"] . "'
	");
	$get_all_with_waypoint_id = $query->fetchAll(PDO::FETCH_ASSOC);
	if (count($get_all_with_waypoint_id) === 0) {
		$orphaned_waypoints_ids[] = $waypoint["id"];
	}
}

$query = $conn->query("
	DELETE FROM `waypoints` WHERE `id` IN ('" .
		implode("','", $orphaned_waypoints_ids)
	. "')
");
$query->execute();

$query = $conn->query("
	SELECT `u`.`id`, `u`.`confirmbefore`
	FROM `users` `u`
	WHERE `u`.`confirmed` = 0
");
$users = $query->fetchAll(PDO::FETCH_ASSOC);
$nowDateTime = new DateTime("now");
foreach($users as $user) {
	$regDateTime = DateTime::createFromFormat("Y-m-d H:i:s", $user["confirmbefore"]);
	if($regDateTime < $nowDateTime) {
		$query = $conn->query("DELETE FROM `users` WHERE `id` = '" . $user["id"] . "'");
		$query->execute();
	}
}

$query = $conn->query("SET FOREIGN_KEY_CHECKS = 1");
$query->execute();
