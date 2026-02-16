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

$raw = file_get_contents("php://input");
$data = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
$list = $data["data"] ?? [];

$faults = [];
/*
1: wrong data,
2: test account,
3: places limit,
4: routes limit,
5: folders limit
*/

// Helpers

function checkSession(AppContext $ctx, string $sessionid): bool {
	$stmt = $ctx->db->prepare("
		SELECT * FROM sessions
		WHERE id = :sessionid
	");
	$stmt->bindValue(":sessionid", uuidToBin($sessionid), PDO::PARAM_LOB);
	$stmt->execute();
	$result = $stmt->fetchAll(PDO::FETCH_ASSOC);
	return (count($result) > 0 ? true : false);
}
function getById(AppContext $ctx, string $table, string $id) {
	$sql = "SELECT * FROM `$table` WHERE id = :id LIMIT 1";
	$stmt = $ctx->db->prepare($sql);
	$stmt->execute([ ":id" => uuidToBin($id) ]);
	return $stmt->fetch(PDO::FETCH_ASSOC);
}
function deleteById(AppContext $ctx, string $table, string $id): void {
	$sql = "DELETE FROM `$table` WHERE id = :id LIMIT 1";
	$stmt = $ctx->db->prepare($sql);
	$stmt->execute([ ":id" => uuidToBin($id) ]);
}
function pointByCoords(AppContext $ctx, float $latitude, float $longitude) {
	$stmt = $ctx->db->prepare("
		SELECT * FROM points
		WHERE latitude = :latitude AND longitude = :longitude
	");
	$stmt->execute([
		":latitude" => $latitude,
		":longitude" => $longitude,
	]);
	return $stmt->fetch(PDO::FETCH_ASSOC);
}
function cleanupPointIfOrphaned(AppContext $ctx, string $pointIdBin): void {
	if ($pointIdBin !== null) {
		$pointRefsStmt = $ctx->db->prepare("
			SELECT COUNT(*) AS refcount
			FROM (
				SELECT pointid FROM places WHERE pointid = :pointid
				UNION ALL
				SELECT pointid FROM pointroute WHERE pointid = :pointid
			) t;
		");
		$pointRefsStmt->execute([
			":pointid" => $pointIdBin,
		]);
		$pointRefs = $pointRefsStmt->fetch(PDO::FETCH_ASSOC);

		if ((int)$pointRefs["refcount"] === 0) {
			$delPointStmt = $ctx->db->prepare("
				DELETE FROM points WHERE id = :pointid
			");
			$delPointStmt->execute([
				":pointid" => $pointIdBin,
			]);
		}
	}
}
function addPoint(AppContext $ctx, array $row): void {
	$sql = "
		INSERT INTO points (
			id, latitude, longitude, altitude, location
		) VALUES (
			:id,
			:latitude,
			:longitude,
			:altitude,
			ST_GeomFromText(CONCAT('POINT(', :longitude, ' ', :latitude, ')'), 4326)
		)
		ON DUPLICATE KEY UPDATE
			latitude  = VALUES(latitude),
			longitude = VALUES(longitude),
			altitude  = VALUES(altitude),
			location  = VALUES(location)
	";
	$stmt = $ctx->db->prepare($sql);
	$stmt->execute([
		":id"        => uuidToBin($row["id"]),
		":latitude"  => $row["latitude"] ?? 0,
		":longitude" => $row["longitude"] ?? 0,
		":altitude"  => $row["altitude"] ?? null,
	]);
}
function updatePoint(AppContext $ctx, array $row): void {
	$sql = "
		UPDATE points
		SET
			latitude  = :latitude,
			longitude = :longitude,
			altitude  = :altitude,
			location  = ST_GeomFromText(CONCAT('POINT(', :longitude, ' ', :latitude, ')'), 4326)
		WHERE id = :id
	";
	$stmt = $ctx->db->prepare($sql);
	$stmt->execute([
		":id"        => uuidToBin($row["id"]),
		":latitude"  => $row["latitude"] ?? 0,
		":longitude" => $row["longitude"] ?? 0,
		":altitude"  => $row["altitude"] ?? null,
	]);
}
function addPlace(AppContext $ctx, array $row): void {
	$sql = "
		INSERT INTO places (
			id, pointid, folderid, name, description, link, time, srt, geomark, common, userid
		) VALUES (
			:id, :pointid, :folderid, :name, :description, :link, :time, :srt, :geomark, :common, :userid
		)
		ON DUPLICATE KEY UPDATE
			pointid     = VALUES(pointid),
			folderid    = VALUES(folderid),
			name        = VALUES(name),
			description = VALUES(description),
			link        = VALUES(link),
			time        = VALUES(time),
			srt         = VALUES(srt),
			geomark     = VALUES(geomark),
			common      = VALUES(common)
	";
	$stmt = $ctx->db->prepare($sql);
	$stmt->execute([
		":id"          => uuidToBin($row["id"]),
		":pointid"     => uuidToBin($row["pointid"]),
		":name"        => $row["name"] ?? "",
		":description" => $row["description"] ?? "",
		":link"        => $row["link"] ?? "",
		":time"        => $row["time"] ?? "",
		":srt"         => $row["srt"] ?? 0,
		":geomark"     => (int)($row["geomark"] ?? 0),
		":common"      => (int)($row["common"] ?? 0),
		":userid"      => uuidToBin($row["userid"]),
		":folderid"    => uuidToBin($row["folderid"]) ?? null,
	]);
}
function updatePlace(AppContext $ctx, array $row, string $myuserid): void {
	$pointIdBin = !empty($row["pointid"])
		? uuidToBin($row["pointid"])
		: null
	;
	$sql = "
		UPDATE places
		SET
			" . ($pointIdBin !== null ? "pointid = :pointid," : "") . "
			folderid    = :folderid,
			name        = :name,
			description = :description,
			link        = :link,
			time        = :time,
			srt         = :srt,
			geomark     = :geomark,
			common      = :common,
			userid      = :userid
		WHERE id = :id
			AND userid = :myuserid
	";
	$stmt = $ctx->db->prepare($sql);
	$bindingArray = [
		":id"          => uuidToBin($row["id"]),
		":name"        => $row["name"] ?? "",
		":description" => $row["description"] ?? "",
		":link"        => $row["link"] ?? "",
		":time"        => $row["time"] ?? "",
		":srt"         => $row["srt"] ?? 0,
		":geomark"     => (int)($row["geomark"] ?? 0),
		":common"      => (int)($row["common"] ?? 0),
		":userid"      => uuidToBin($row["userid"]),
		":myuserid"    => uuidToBin($myuserid),
		":folderid"    => uuidToBin($row["folderid"]) ?? null,
	];
	if ($pointIdBin !== null) {
		$bindingArray[":pointid"] = $pointIdBin;
	}
	$stmt->execute($bindingArray);
}
function deletePlace(AppContext $ctx, array $row, string $myuserid): void {
	$delPlaceStmt = $ctx->db->prepare("
		DELETE FROM places
		WHERE id = :id
			AND userid = :userid
	");
	$delPlaceStmt->execute([
		":id" => uuidToBin($row["id"]),
		":userid" => uuidToBin($myuserid),
	]);

	$pointIdBin = !empty($row["pointid"])
		? uuidToBin($row["pointid"])
		: null
	;
	cleanupPointIfOrphaned($ctx, $pointIdBin);
}
function addRoute(AppContext $ctx, array $row, string $myuserid): void {
	$idBin = uuidToBin($row["id"]);
	$userIdBin = uuidToBin($myuserid);
	$folderId = uuidToBin($row["folderid"]);
	$ctx->db->prepare("
		INSERT INTO routes (id, userid, name, description, folderid, srt, time, link, geomarks, common)
		VALUES (:id, :userid, :name, :description, :folderid, :srt, NOW(), :link, :geomarks, :common)
	")->execute([
		":id"          => $idBin,
		":userid"      => $userIdBin,
		":name"        => $row["name"] ?? "",
		":description" => $row["description"] ?? "",
		":folderid"    => $folderId,
		":srt"         => (int)($row["srt"] ?? 0),
		":link"        => $row["link"] ?? "",
		":geomarks"    => (int)($row["geomarks"] ?? 0),
		":common"      => (int)($row["common"] ?? 0),
	]);
	if (!empty($row["points"]) && is_array($row["points"])) {
		$insPR = $ctx->db->prepare("
			INSERT INTO pointroute (routeid, pointid, name, description, srt)
			VALUES (:id, :pid, :name, :description, :srt)
		");
		foreach ($row["points"] as $index => $pMeta) {
			if (!empty($pMeta["id"])) {
				$insPR->execute([
					":id"          => $idBin,
					":pid"         => uuidToBin($pMeta["id"]),
					":name"        => $pMeta["name"] ?? null,
					":description" => $pMeta["description"] ?? null,
					":srt"         => $index,
				]);
			}
		}
	}
	$ctx->db->prepare("
		UPDATE users SET lastupdates = NOW() WHERE id = :userid
	")->execute([
		":userid" => $userIdBin,
	]);
}
function updateRoute(AppContext $ctx, array $row, string $myuserid): void {
	$idBin = uuidToBin($row["id"]);
	$userIdBin = uuidToBin($myuserid);
	$folderId = uuidToBin($row["folderid"]);
	$ctx->db->prepare("
		UPDATE routes
		SET
			name        = :name,
			description = :description,
			folderid    = :folderid,
			srt         = :srt,
			link        = :link,
			geomarks    = :geomarks,
			common      = :common
		WHERE id = :id AND userid = :userid
	")->execute([
		":name"        => $row["name"] ?? "",
		":description" => $row["description"] ?? "",
		":folderid"    => $folderId,
		":srt"         => (int)($row["srt"] ?? 0),
		":link"        => $row["link"] ?? "",
		":geomarks"    => (int)($row["geomarks"] ?? 0),
		":common"      => (int)($row["common"] ?? 0),
		":id"          => $idBin,
		":userid"      => $userIdBin,
	]);
	$oldPointsStmt = $ctx->db->prepare("
		SELECT pointid FROM pointroute WHERE routeid = :id
	");
	$oldPointsStmt->execute([
		":id" => $idBin,
	]);
	$oldPointIds = $oldPointsStmt->fetchAll(PDO::FETCH_COLUMN);

	$ctx->db->prepare("
		DELETE FROM pointroute WHERE routeid = :id
	")->execute([
		":id" => $idBin,
	]);
	if (!empty($row["points"]) && is_array($row["points"])) {
		$insPR = $ctx->db->prepare("
			INSERT INTO pointroute (routeid, pointid, name, description, srt)
			VALUES (:id, :pid, :name, :description, :srt)
		");
		foreach ($row["points"] as $index => $pMeta) {
			if (!empty($pMeta["id"])) {
				$insPR->execute([
					":id"          => $idBin,
					":pid"         => uuidToBin($pMeta["id"]),
					":name"        => $pMeta["name"] ?? null,
					":description" => $pMeta["description"] ?? null,
					":srt"         => $index,
				]);
			}
		}
	}
	foreach (array_unique($oldPointIds) as $pointIdBin) {
		cleanupPointIfOrphaned($ctx, $pointIdBin);
	}
	$ctx->db->prepare("
		UPDATE users SET lastupdates = NOW() WHERE id = :userid
	")->execute([
		":userid" => $userIdBin,
	]);
}
function deleteRoute(AppContext $ctx, array $row, string $myuserid): void {
	$idBin = uuidToBin($row["id"]);
	$routePointIdsStmt = $ctx->db->prepare("
		SELECT pointid FROM pointroute WHERE routeid = :id
	");
	$routePointIdsStmt->execute([
		":id" => $idBin,
	]);
	$routePointIds = $routePointIdsStmt->fetchAll(PDO::FETCH_COLUMN);

	$ctx->db->prepare("
		DELETE FROM pointroute WHERE routeid = :id
	")->execute([
		":id" => $idBin,
	]);
	$ctx->db->prepare("
		DELETE FROM routes WHERE id = :id AND userid = :userid
	")->execute([
		":id" => $idBin,
		":userid" => uuidToBin($myuserid),
	]);

	foreach (array_unique($routePointIds) as $pointIdBin) {
		cleanupPointIfOrphaned($ctx, $pointIdBin);
	}
}
function addFolder(AppContext $ctx, array $row): void {
	$sql = "
		INSERT INTO folders (
			id,
			parent,
			userid,
			context,
			name,
			description,
			srt,
			geomarks
		)
		VALUES (
			:id,
			:parent,
			:userid,
			:context,
			:name,
			:description,
			:srt,
			:geomarks
		)
		ON DUPLICATE KEY UPDATE
			parent      = VALUES(parent),
			context     = VALUES(context),
			name        = VALUES(name),
			description = VALUES(description),
			srt         = VALUES(srt),
			geomarks    = VALUES(geomarks)
	";
	$stmt = $ctx->db->prepare($sql);
	$stmt->execute([
		":id"          => uuidToBin($row["id"]),
		":parent"      => uuidToBin($row["parent"]),
		":userid"      => uuidToBin($row["userid"]),
		":context"     => $row["context"] ?? "places",
		":name"        => $row["name"] ?? "",
		":description" => $row["description"] ?? "",
		":srt"         => $row["srt"] ?? 0,
		":geomarks"    => (int)($row["geomarks"] ?? 0),
	]);
}
function updateFolder(AppContext $ctx, array $row, string $myuserid): void {
	$sql = "
		UPDATE folders
		SET
			parent      = :parent,
			userid      = :userid,
			context     = :context,
			name        = :name,
			description = :description,
			srt         = :srt,
			geomarks    = :geomarks
		WHERE id = :id
			AND userid = :myuserid
	";
	$stmt = $ctx->db->prepare($sql);
	$stmt->execute([
		":id"          => uuidToBin($row["id"]),
		":parent"      => uuidToBin($row["parent"]),
		":userid"      => uuidToBin($row["userid"]),
		":myuserid"    => uuidToBin($myuserid),
		":context"     => $row["context"] ?? "places",
		":name"        => $row["name"] ?? "",
		":description" => $row["description"] ?? "",
		":srt"         => $row["srt"] ?? 0,
		":geomarks"    => (int)($row["geomarks"] ?? 0),
	]);
}
function addImage(AppContext $ctx, array $img): void {
	$sql = "
		INSERT INTO images (id, placeid, file, size, type, lastmodified, srt)
		VALUES (:id, :placeid, :file, :size, :type, :lastmodified, :srt)
		ON DUPLICATE KEY UPDATE
			placeid      = VALUES(placeid)
			file         = VALUES(file),
			size         = VALUES(size),
			type         = VALUES(type),
			lastmodified = VALUES(lastmodified),
			srt          = VALUES(srt)
	";
	$stmt = $ctx->db->prepare($sql);
	$stmt->execute([
		":id"           => uuidToBin($img["id"]),
		":placeid"      => uuidToBin($img["placeid"]),
		":file"         => $img["file"] ?? "",
		":size"         => (int)($img["size"] ?? 0),
		":type"         => $img["type"] ?? "",
		":lastmodified" => (int)($img["lastmodified"] ?? 0),
		":srt"          => (int)($img["srt"] ?? 0),
	]);
}
function updateImage(AppContext $ctx, array $img): void {
	$placeIdBin = null;
	$routeIdBin = null;
	if (!empty($img["placeid"])) {
		$placeIdBin = uuidToBin($img["placeid"]);
	}
	if (!empty($img["routeid"])) {
		$routeIdBin = uuidToBin($img["routeid"]);
	}
	$sql = "
		UPDATE images
		SET
			" . ($placeIdBin !== null ? "placeid = :placeid," : "") . "
			" . ($routeIdBin !== null ? "routeid = :routeid," : "") . "
			file         = :file,
			size         = :size,
			type         = :type,
			lastmodified = :lastmodified,
			srt          = :srt
		WHERE id = :id
	";
	$stmt = $ctx->db->prepare($sql);
	$bindingArray = [
		":id"           => uuidToBin($img["id"]),
		":file"         => $img["file"] ?? "",
		":size"         => (int)($img["size"] ?? 0),
		":type"         => $img["type"] ?? "",
		":lastmodified" => (int)($img["lastmodified"] ?? 0),
		":srt"          => (int)($img["srt"] ?? 0),
	];
	if ($placeIdBin !== null) {
		$bindingArray[":placeid"] = $placeIdBin;
	}
	if ($routeIdBin !== null) {
		$bindingArray[":routeid"] = $routeIdBin;
	}
	$stmt->execute($bindingArray);
}

// Session check

if (checkSession($ctx, $data["sessionid"]) === false) {
	echo 5; exit;
}

// Transaction

try {
	$ctx->db->beginTransaction();

	$visiting = $ctx->db->query("
		SELECT `id`
		FROM `groups`
		WHERE id IN (
			SELECT `group` FROM usergroup WHERE `user` =
			{$ctx->db->quote(uuidToBin($data['userid']))}
		)
			AND `parent` = 'visiting'
	")->fetch(PDO::FETCH_ASSOC);
	$groupId = $visiting["id"] ?? null;

	if (!empty($list['points'])) {
		$delPointStmt = $ctx->db->prepare("
			DELETE FROM points
			WHERE id = :id
		");
		foreach ($list['points'] as $row) {
			if (!empty($row["deleted"])) {
				$delPointStmt->execute([
					":id" => uuidToBin($row["id"]),
				]);
			}
			elseif (!empty($row["added"])) {
				addPoint($ctx, $row);
			}
			elseif (!empty($row["updated"])) {
				updatePoint($ctx, $row);
			}
		}
	}

	if (!empty($list['folders'])) {

		$folderscount = (int)$ctx->db->query("
			SELECT COUNT(*) AS c
			FROM folders
			WHERE userid = {$ctx->db->quote(uuidToBin($data['userid']))}
		")->fetch(PDO::FETCH_ASSOC)["c"];
		$foldersLimit = $groupId && isset($rights["folderscount"][$groupId])
			? (int)$rights["folderscount"][$groupId] : 0;

		$delta = 0;

		foreach ($list['folders'] as $row) {
			if (!empty($row["deleted"])) {
				$delta--;
				$delFolderStmt = $ctx->db->prepare("
					DELETE FROM folders
					WHERE id = :id
						AND userid = :userid
				");
				$delFolderStmt->execute([
					":id" => uuidToBin($row["id"]),
					":userid" => uuidToBin($data["userid"])
				]);
			}
			elseif (!empty($row["added"])) {
				if ($foldersLimit >= 0 && $folderscount >= $foldersLimit) {
					if (!in_array(4, $faults)) $faults[] = 5; // limit
					continue;
				}
				if ($foldersLimit >= 0) $folderscount++;
				addFolder($ctx, $row);
			}
			elseif (!empty($row["updated"])) {
				updateFolder($ctx, $row, $data["userid"]);
			}
		}
	}

	if (!empty($list['places'])) {

		$placescount = (int)$ctx->db->query("
			SELECT COUNT(*) AS c
			FROM places
			WHERE userid = {$ctx->db->quote(uuidToBin($data['userid']))}
		")->fetch(PDO::FETCH_ASSOC)["c"];
		$placesLimit = $groupId && isset($rights["placescount"][$groupId])
			? (int)$rights["placescount"][$groupId] : 0;

		$delta = 0;

		foreach ($list['places'] as $row) {
			if (!empty($row["deleted"])) {
				$delta--;
				deletePlace($ctx, $row, $data["userid"]);
			}
			elseif (!empty($row["added"]) && getById($ctx, "points", $row["pointid"])) {
				$delta++;
				if ($placesLimit >= 0 && $placescount >= $placesLimit) {
					if (!in_array(3, $faults)) $faults[] = 3; // limit
					continue;
				}
				$placescount++;
				addPlace($ctx, $row);
			}
			elseif (!empty($row["updated"])) {
				updatePlace($ctx, $row, $data["userid"]);
			}
			elseif (!empty($row["images"]) && is_array($row["images"])) {
				foreach ($row["images"] as $img) {
					addImage($ctx, $img);
				}
			}
		}
	}

	if (!empty($list['routes'])) {

		$routescount = (int)$ctx->db->query("
			SELECT COUNT(*) AS c
			FROM routes
			WHERE userid = {$ctx->db->quote(uuidToBin($data['userid']))}
		")->fetch(PDO::FETCH_ASSOC)["c"];
		$routesLimit = $groupId && isset($rights["routescount"][$groupId])
			? (int)$rights["routescount"][$groupId] : 0;

		$delta = 0;

		foreach ($list['routes'] as $row) {
			if (!empty($row["deleted"])) {
				$delta--;
				deleteRoute($ctx, $row, $data["userid"]);
			}
			elseif (!empty($row["added"])) {
				$delta++;
				if ($routesLimit >= 0 && $routescount >= $routesLimit) {
					if (!in_array(3, $faults)) $faults[] = 4; // limit
					continue;
				}
				$routescount++;
				addRoute($ctx, $row, $data["userid"]);
			}
			elseif (!empty($row["updated"])) {
				updateRoute($ctx, $row, $data["userid"]);
			}
/* TODO Uncomment after refactoring, remembering to adapt the functions to the routes.
			elseif (!empty($row["images"]) && is_array($row["images"])) {
				foreach ($row["images"] as $img) {
					addImage($ctx, $img);
				}
			}
*/
		}
	}

	if (!empty($list['images_update'])) {
		foreach ($list['images_update'] as $img) updateImage($ctx, $img);
	}

	if (!empty($list['images_delete'])) {
		foreach ($list['images_delete'] as $row) {
			deleteById($ctx, "images", $row["id"]);
		}
	}

	if (!empty($list['images_upload'])) {
		foreach ($list['images_upload'] as $img) addImage($ctx, $img);
	}

	$ctx->db->commit();

} catch (Throwable $e) {
	error_log($e->getMessage());
	$ctx->db->rollBack();
	if (!in_array(1, $faults)) $faults[] = 1;
}
echo json_encode(
	$faults,
	JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_NUMERIC_CHECK
);
exit;
