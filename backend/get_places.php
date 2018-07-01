<?php
include 'config.php';
include 'newpdo.php';

$query = $conn->query("SELECT * FROM `places` ORDER BY `srt`");
$places = $query->fetchAll(PDO::FETCH_ASSOC);
$query = $conn->query("SELECT * FROM `images` ORDER BY `id`");
$images = $query->fetchAll(PDO::FETCH_ASSOC);
foreach($places as $places_key => $places_value) {
	foreach($images as $images_value) {
		if($images_value["places_id"] == $places_value["id"]) {
			$places[$places_key]["images"][] = $images_value;
		}
	}
}
echo json_encode($places, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
