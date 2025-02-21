<?php
include "config.php";
include "newpdo.php";

$waypoints = []; $places = []; $common_places = []; $folders = [];
$query = $conn->query("
	SELECT
		`w`.`id`,
		`w`.`latitude`,
		`w`.`longitude`,
		`w`.`time`,
		`w`.`common`
	FROM `waypoints` `w`
	INNER JOIN `places` `p`
	ON `w`.`id` = `p`.`waypoint`
	AND (
		`p`.userid = '" . $_GET["id"] . "'
		OR `p`.`common` = 1
	)
");
$all_waypoints = $query->fetchAll(PDO::FETCH_ASSOC);
foreach ($all_waypoints as $value) {
	$waypoints[$value["id"]] = $value;
}
$query = $conn->query("
	SELECT *
	FROM `places` `p`
	WHERE `p`.`userid` = '" . $_GET["id"] . "'
	OR `p`.`common` = 1
");
$all_places = $query->fetchAll(PDO::FETCH_ASSOC);
foreach ($all_places as $value) {
	if ($value["userid"] == $_GET["id"]) {
		$places[$value["id"]] = $value;
	} elseif ($value["common"] == 1) {
		$common_places[$value["id"]] = $value;
	}
}
$query = $conn->query("SELECT * FROM `images`");
$images = $query->fetchAll(PDO::FETCH_ASSOC);
foreach ($images as $value) {
	if (array_key_exists($value["placeid"], $places)) {
		$places[$value["placeid"]]["images"][$value["id"]] = $value;
	}
	if (array_key_exists($value["placeid"], $common_places)) {
		$common_places[$value["placeid"]]["images"][$value["id"]] = $value;
	}
}

$query = $conn->query("
	SELECT *
	FROM `folders` `f`
	WHERE `f`.`userid` = '" . $_GET["id"] . "'
");
$all_folders = $query->fetchAll(PDO::FETCH_ASSOC);
foreach ($all_folders as $value) {
	$folders[$value["id"]] = $value;
}
echo json_encode([
	"waypoints" => $waypoints,
	"places" => $places,
	"common_places" => $common_places,
	"folders" => $folders
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_NUMERIC_CHECK);
