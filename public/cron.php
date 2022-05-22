<?php
include "./backend/config.php";
include "./backend/newpdo.php";

$query = $conn->query("
	SELECT `w`.`id`
	FROM `waypoints` `w`
");
$query->execute();
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
