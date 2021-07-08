<?php
include "config.php";
include "newpdo.php";

$places = []; $common_places = []; $folders = [];
$query = $conn->query("SELECT `p`.`id`, `p`.`folderid`, `p`.`name`, `p`.`description`, `p`.`link`, `p`.`latitude`, `p`.`longitude`, `p`.`altitudecapability`, `p`.`time`, `p`.`srt`, `p`.`common`, `p`.`userid` FROM `places` `p` WHERE `p`.`userid` = '" . $_GET["id"] . "' OR `p`.`common` = 1");
$all_places = $query->fetchAll(PDO::FETCH_ASSOC);
foreach($all_places as $all_places_value) {
	if($all_places_value["userid"] == $_GET["id"]) {
		$places[$all_places_value["id"]] = $all_places_value;
		$places[$all_places_value["id"]]["images"] = [];
	} elseif($all_places_value["common"] == 1) {
		$common_places[$all_places_value["id"]] = $all_places_value;
		$common_places[$all_places_value["id"]]["images"] = [];
	}
}
$query = $conn->query("SELECT * FROM `images` ORDER BY `srt`");
$images = $query->fetchAll(PDO::FETCH_ASSOC);
foreach($images as $images_value) {
	if(array_key_exists($images_value["placeid"], $places)) {
		$places[$images_value["placeid"]]["images"][] = $images_value;
	}
	if(array_key_exists($images_value["placeid"], $common_places)) {
		$common_places[$images_value["placeid"]]["images"][] = $images_value;
	}
}

$query = $conn->query("SELECT `f`.`id`, `f`.`parent`, `f`.`name`, `f`.`description`, `f`.`srt` FROM `folders` `f` WHERE `f`.`userid` = '" . $_GET["id"] . "' ORDER BY `srt`");
$folders = $query->fetchAll(PDO::FETCH_ASSOC);
foreach($places as $places_key => $places_value) {
	$places[] = $places_value;
	unset($places[$places_key]);
}
foreach($common_places as $common_places_key => $common_places_value) {
	$common_places[] = $common_places_value;
	unset($common_places[$common_places_key]);
}
echo json_encode([$places, $common_places, $folders], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_NUMERIC_CHECK);
