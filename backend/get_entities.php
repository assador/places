<?php
declare(strict_types=1);
error_reporting(E_ALL);
ini_set("display_errors", "1");

/* “Let there be light!” the beaver said. Debug with smile, that’s what we get.
set_exception_handler(function($e) {
	header("Content-Type: application/json");
	http_response_code(500);
	echo $e->getMessage();
	echo "\nfile: {$e->getFile()}";
	echo "\nline: {$e->getLine()}";
	exit;
});
*/

require_once __DIR__ . "/bootstrap.php";

$raw = file_get_contents("php://input");
$data = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
$binUserId = uuidToBin($data["userid"]);
$binSessionId = uuidToBin($data["sessionid"]);

// SEC Check

if (!isValidSession($ctx, $binUserId, $binSessionId)) {
	throw new Exception("Invalid or expired session.");
}

// SEC Points

function getPoints(AppContext $ctx, string $binUserId): array {
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
			JOIN routes rt ON rt.id = ptk.routeid
			WHERE ptk.pointid = pt.id
				AND (rt.userid = :uid OR rt.common = 1)
		);
	");
	$stmt->bindValue(":uid", $binUserId, PDO::PARAM_LOB);
	$stmt->execute();
	$points_bin = $stmt->fetchAll(PDO::FETCH_ASSOC);

	$points = [];
	foreach ($points_bin as $idx => $row) {
		$row["id"] = binToUuid($row["id"]);
		$points[$row["id"]] = $row;
	}
	return $points;
}

// SEC Images

function getImages(AppContext $ctx, string $binUserId): array {
	$stmt = $ctx->db->prepare("
		SELECT i.*
		FROM images i
		WHERE i.committed = 1
		AND (
			EXISTS (
				SELECT 1
				FROM places p
				WHERE p.id = i.placeid
					AND (p.userid = :uid OR p.common = 1)
			)
			OR
			EXISTS (
				SELECT 1
				FROM routes r
				WHERE r.id = i.routeid
					AND (r.userid = :uid OR r.common = 1)
			)
		)
	");
	$stmt->bindValue(':uid', $binUserId, PDO::PARAM_LOB);
	$stmt->execute();

	$images = [];
	while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
		$row["id"] = binToUuid($row["id"]);
		$row["placeid"] = binToUuid($row["placeid"]);
		$row["routeid"] = binToUuid($row["routeid"]);
		$images[$row["id"]] = $row;
	}
	return $images;
}

// SEC Places

function getPlaces(AppContext $ctx, string $binUserId): array {
	$stmt = $ctx->db->prepare("
		SELECT p.*
		FROM places p
		WHERE p.userid = :uid OR p.common = 1
	");
	$stmt->bindValue(':uid', $binUserId, PDO::PARAM_LOB);
	$stmt->execute();

	$places = [
		"places"       => [],
		"commonPlaces" => [],
	];
	$userid = binToUuid($binUserId);
	while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
		$row["id"] = binToUuid($row["id"]);
		$row["userid"] = binToUuid($row["userid"]);
		$row["pointid"] = binToUuid($row["pointid"]);
		$row["folderid"] = binToUuid($row["folderid"]);
		if (!empty($row["time"])) {
			$row["time"] = (int) $row["time"];
		} else {
			unset($row["time"]);
		}
		if ($row["userid"] === $userid) {
			$places["places"][$row["id"]] = $row;
		} elseif ($row["common"] == 1) {
			$places["commonPlaces"][$row["id"]] = $row;
		}
	}
	return $places;
}

// SEC Routes

function getRoutes(AppContext $ctx, string $binUserId): array {
	$stmt = $ctx->db->prepare("
		SELECT r.*
		FROM routes r
		WHERE r.userid = :uid OR r.common = 1
	");
	$stmt->bindValue(':uid', $binUserId, PDO::PARAM_LOB);
	$stmt->execute();

	$routes = [
		"routes"       => [],
		"commonRoutes" => [],
	];
	$userid = binToUuid($binUserId);
	while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
		$row["id"] = binToUuid($row["id"]);
		$row["userid"] = binToUuid($row["userid"]);
		$row["folderid"] = binToUuid($row["folderid"]);
		if (!empty($row["time"])) {
			$row["time"] = (int) $row["time"];
		} else {
			unset($row["time"]);
		}
		if ($row["userid"] === $userid) {
			$routes["routes"][$row["id"]] = $row;
		} elseif ($row["common"] == 1) {
			$routes["commonRoutes"][$row["id"]] = $row;
		}
	}
	$all = function & (array &$a, array &$b) {
		foreach ($a as &$val) yield $val;
		foreach ($b as &$val) yield $val;
	};

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
	foreach ($all($routes["routes"], $routes["commonRoutes"]) as &$row) {
		$routePointsStmt->bindValue(":routeid", uuidToBin($row["id"]), PDO::PARAM_LOB);
		$routePointsStmt->execute();
		$pointRows = $routePointsStmt->fetchAll(PDO::FETCH_ASSOC);
		$points = [];
		foreach ($pointRows as $pointRow) {
			$points[] = [
				"id"          => binToUuid($pointRow["pointid"]),
				"name"        => $pointRow["name"] ?? "",
				"description" => $pointRow["description"] ?? "",
			];
		}
		$row["points"] = $points;
	}
	unset($row);
	return $routes;
}

// SEC Folders

function getFolders(AppContext $ctx, string $binUserId): array {
	$stmt = $ctx->db->prepare("
		SELECT * FROM folders WHERE userid = :uid
	");
	$stmt->bindValue(":uid", $binUserId, PDO::PARAM_LOB);
	$stmt->execute();

	$folders = [];
	foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
		$row["id"] = binToUuid($row["id"]);
		$row["parent"] = binToUuid($row["parent"]);
		$row["userid"] = binToUuid($row["userid"]);
		$folders[$row["id"]] = $row;
	}
	return $folders;
}

$images = [];
$places = [];
$routes = [];

// SEC Transaction

try {
	$ctx->db->beginTransaction();

	$images = getImages($ctx, $binUserId);
	$places = getPlaces($ctx, $binUserId);
	$routes = getRoutes($ctx, $binUserId);

	foreach ($images as $img) {
		if ($img["placeid"]) {
			if (isset($places["places"][$img["placeid"]])) {
				$places["places"][$img["placeid"]]["images"][$img["id"]] = $img;
			}
			if (isset($places["commonPlaces"][$img["placeid"]])) {
				$places["commonPlaces"][$img["placeid"]]["images"][$img["id"]] = $img;
			}
		}
		if ($img["routeid"]) {
			if (isset($routes["routes"][$img["routeid"]])) {
				$routes["routes"][$img["routeid"]]["images"][$img["id"]] = $img;
			}
			if (isset($routes["commonRoutes"][$img["routeid"]])) {
				$routes["commonRoutes"][$img["routeid"]]["images"][$img["id"]] = $img;
			}
		}
	}

	$ctx->db->commit();

} catch (Throwable $e) {
	error_log($e->getMessage());
	if ($ctx->db->inTransaction()) $ctx->db->rollBack();
}

header("Content-Type: application/json");
echo json_encode(
	[
		"folders"      => getFolders($ctx, $binUserId),
		"points"       => getPoints($ctx, $binUserId),
		"places"       => $places["places"],
		"routes"       => $routes["routes"],
		"commonPlaces" => $places["commonPlaces"],
		"commonRoutes" => $routes["commonRoutes"],
	],
	JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_NUMERIC_CHECK
);
