<?php
declare(strict_types=1);
error_reporting(E_ALL);
ini_set('display_errors', '1');

require_once __DIR__ . '/bootstrap.php';

$userIdBin = uuidToBin($_GET["id"]);

$points = [];
$places = [];
$common_places = [];
$folders = [];

// Get points.
$stmt = $ctx->db->prepare("
SELECT DISTINCT
	pt.id,
	pt.latitude,
	pt.longitude,
	pt.altitude
FROM points pt
WHERE
	EXISTS (
		SELECT 1
		FROM places pl
		WHERE pl.pointid = pt.id
			AND (pl.userid = :uid OR pl.common = 1)
	)
	OR
	EXISTS (
		SELECT 1
		FROM pointroute ptk
		JOIN routes tr ON tr.id = ptk.routeid
		WHERE ptk.pointid = pt.id
			AND (tr.userid = :uid OR tr.common = 1)
	);
");
$stmt->bindValue(":uid", $userIdBin, PDO::PARAM_LOB);
$stmt->execute();
$points_bin = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($points_bin as $idx => $row) {
	$row["id"] = binToUuid($row["id"]);
	$points[$row["id"]] = $row;
}

// Get places (own and common).
$stmt = $ctx->db->prepare("
	SELECT *
	FROM `places` `pl`
	WHERE `pl`.`userid` = :uid OR `pl`.`common` = 1
");
$stmt->bindValue(":uid", $userIdBin, PDO::PARAM_LOB);
$stmt->execute();
$places_bin = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($places_bin as $idx => $row) {
	$row["id"] = binToUuid($row["id"]);
	$row["userid"] = binToUuid($row["userid"]);
	$row["pointid"] = binToUuid($row["pointid"]);
	if ($row["folderid"] != null) $row["folderid"] = binToUuid($row["folderid"]);
	if ($row["userid"] == $_GET["id"]) {
		$places[$row["id"]] = $row;
	} elseif ($row["common"] == 1) {
		$common_places[$row["id"]] = $row;
	}
}

// Get images and put them in place.
$stmt = $ctx->db->query("
	SELECT *
	FROM images
");
$images_bin = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($images_bin as $idx => $row) {
	$row["id"] = binToUuid($row["id"]);
	$row["placeid"] = binToUuid($row["placeid"]);
	if (isset($places[$row["placeid"]])) {
		$places[$row["placeid"]]["images"][$row["id"]] = $row;
	}
	if (isset($common_places[$row["placeid"]])) {
		$common_places[$row["placeid"]]["images"][$row["id"]] = $row;
	}
}

// Get folders.
$stmt = $ctx->db->prepare("SELECT * FROM folders WHERE userid = :uid");
$stmt->bindValue(":uid", $userIdBin, PDO::PARAM_LOB);
$stmt->execute();

foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
	$row["id"] = binToUuid($row["id"]);
	$row["userid"] = binToUuid($row["userid"]);
	if ($row["parent"] !== null) {
		$row["parent"] = binToUuid($row["parent"]);
	}
	$folders[$row["id"]] = $row;
}

// Return JSON.
echo json_encode([
	"points" => $points,
	"places" => $places,
	"common_places" => $common_places,
	"folders" => $folders
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_NUMERIC_CHECK);
