<?php
include "config.php";
include "newpdo.php";

$places = []; $common_places = [];
$query = $conn->query("SELECT `p`.`id`, `p`.`name`, `p`.`description`, `p`.`latitude`, `p`.`longitude`, `p`.`srt`, `p`.`common`, `p`.`userid` FROM `places` `p` WHERE `p`.`userid` = '" . $_GET["id"] . "' OR `p`.`common` = 1 ORDER BY `common`, `srt`");
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
$i = 0;
foreach($places as $places_key => $places_value) {
	$places[$i++] = $places_value;
	unset($places[$places_key]);
}
$i = 0;
foreach($common_places as $common_places_key => $common_places_value) {
	$common_places[$i++] = $common_places_value;
	unset($common_places[$common_places_key]);
}
echo json_encode([$places, $common_places], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_NUMERIC_CHECK);
