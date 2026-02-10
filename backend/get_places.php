<?php
declare(strict_types=1);
error_reporting(E_ALL);
ini_set('display_errors', '1');

/* “Let there be light!” the beaver said. Debug with smile, that’s what we get.
set_exception_handler(function($e) {
	header('Content-Type: application/json');
	http_response_code(500);
	echo json_encode([
		'error' => $e->getMessage(),
		'file' => $e->getFile(),
		'line' => $e->getLine(),
	]);
	exit;
});
*/

require_once __DIR__ . '/bootstrap.php';

$userIdBin = uuidToBin($_GET["id"]);

// SEC Points

function getPoints(AppContext $ctx, string $userIdBin): array {
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

	$points = [];
	foreach ($points_bin as $idx => $row) {
		$row["id"] = binToUuid($row["id"]);
		$points[$row["id"]] = $row;
	}
	return $points;
}

// SEC Places (own and common)

function getPlaces(AppContext $ctx, string $userIdBin): array {
	$stmt = $ctx->db->prepare("
		SELECT *
		FROM `places` `pl`
		WHERE `pl`.`userid` = :uid OR `pl`.`common` = 1
	");
	$stmt->bindValue(":uid", $userIdBin, PDO::PARAM_LOB);
	$stmt->execute();
	$places_bin = $stmt->fetchAll(PDO::FETCH_ASSOC);

	$places = [
		'places'       => [],
		'commonPlaces' => [],
	];
	foreach ($places_bin as $idx => $row) {
		$row["id"] = binToUuid($row["id"]);
		$row["userid"] = binToUuid($row["userid"]);
		$row["pointid"] = binToUuid($row["pointid"]);
		if ($row["folderid"] != null) $row["folderid"] = binToUuid($row["folderid"]);
		if ($row["userid"] == $_GET["id"]) {
			$places['places'][$row["id"]] = $row;
		} elseif ($row["common"] == 1) {
			$places['commonPlaces'][$row["id"]] = $row;
		}
	}

	// SEC Places Images

	$stmt = $ctx->db->query("
		SELECT * FROM images
	");
	$images_bin = $stmt->fetchAll(PDO::FETCH_ASSOC);

	foreach ($images_bin as $idx => $row) {
		$row['id'] = binToUuid($row['id']);
		$row['placeid'] = binToUuid($row['placeid']);
		if (isset($places['places'][$row['placeid']])) {
			$places['places'][$row['placeid']]['images'][$row['id']] = $row;
		}
		if (isset($places['commonPlaces'][$row['placeid']])) {
			$places['commonPlaces'][$row['placeid']]['images'][$row['id']] = $row;
		}
	}

	return $places;
}

// SEC Routes

function getRoutes(AppContext $ctx, string $userIdBin): array {
	$stmt = $ctx->db->prepare("
		SELECT *
		FROM routes
		WHERE userid = :userid
		ORDER BY srt ASC
	");
	$stmt->execute([
		':userid' => $userIdBin,
	]);
	$routeRows = $stmt->fetchAll(PDO::FETCH_ASSOC);

	$routePointsStmt = $ctx->db->prepare("
		SELECT
			pr.pointid,
			pr.name,
			pr.description
		FROM pointroute pr
		JOIN points p ON pr.pointid = p.id
		WHERE pr.routeid = :routeid
		ORDER BY pr.srt ASC
	");

	$routes = [];
	foreach ($routeRows as $routeRow) {
		$routePointsStmt->execute([
			':routeid' => $routeRow['id'],
		]);
		$pointRows = $routePointsStmt->fetchAll(PDO::FETCH_ASSOC);
		$points = [];
		foreach ($pointRows as $pointRow) {
			$points[] = [
				"id"          => binToUuid($pointRow['pointid']),
				"name"        => $pointRow['name'] ?? "",
				"description" => $pointRow['description'] ?? "",
			];
		}
		$routes[] = [
			'id'          => binToUuid($routeRow['id']),
			'folderid'    => binToUuid($routeRow['folderid']) ?? "routesroot",
			'userid'      => $_GET["id"],
			'name'        => $routeRow['name'] ?? "",
			'description' => $routeRow['description'] ?? "",
			'link'        => $routeRow['link'] ?? "",
			'time'        => $routeRow['time'],
			'srt'         => (int)$routeRow['srt'],
			'common'      => (bool)$routeRow['common'],
			'geomarks'    => (bool)$routeRow['geomarks'],
			'points'      => $points,
			'images'      => [] // TODO Implement when they are refactored
		];
	}
	return $routes;
}

// SEC Folders

function getFolders(AppContext $ctx, string $userIdBin): array {
	$stmt = $ctx->db->prepare("
		SELECT * FROM folders WHERE userid = :uid
	");
	$stmt->bindValue(':uid', $userIdBin, PDO::PARAM_LOB);
	$stmt->execute();

	$folders = [];
	foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
		$row['id'] = binToUuid($row['id']);
		$row['userid'] = binToUuid($row['userid']);
		if ($row['parent'] !== null) {
			$row['parent'] = binToUuid($row['parent']);
		}
		$folders[$row['id']] = $row;
	}
	return $folders;
}

// SEC JSON to front

$places = getPlaces($ctx, $userIdBin);
echo json_encode([
	'points'       => getPoints($ctx, $userIdBin),
	'places'       => $places['places'],
	'commonPlaces' => $places['commonPlaces'],
	'routes'       => getRoutes($ctx, $userIdBin),
	'folders'      => getFolders($ctx, $userIdBin),
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_NUMERIC_CHECK);
