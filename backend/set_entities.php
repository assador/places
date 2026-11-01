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
$list = $data["data"] ?? [];

$faults = [];
/*
1: wrong data,
2: wrong session,
3: test account,
4: places limit,
5: routes limit,
6: folders limit
*/

// SEC Statements cache

$stmtCache = [];

function getCachedStmt(AppContext $ctx, string $key, string $sql): PDOStatement {
	global $stmtCache;
	if (!isset($stmtCache[$key])) {
		$stmtCache[$key] = $ctx->db->prepare($sql);
	}
	return $stmtCache[$key];
}

// Helpers

function checkSession(AppContext $ctx, string $sessionid): bool {
	$stmt = $ctx->db->prepare("
		SELECT 1 FROM sessions
		WHERE id = :sessionid
		LIMIT 1
	");
	$stmt->bindValue(":sessionid", uuidToBin($sessionid), PDO::PARAM_LOB);
	$stmt->execute();
	return (bool) $stmt->fetch();
}

function getById(AppContext $ctx, string $table, string $id) {
	$sql = "
		SELECT * FROM `$table`
		WHERE id = :id
		LIMIT 1
	";
	$stmt = getCachedStmt($ctx, "get_by_$table", $sql);
	$stmt->execute([":id" => uuidToBin($id)]);
	return $stmt->fetch(PDO::FETCH_ASSOC);
}

function deleteById(AppContext $ctx, string $table, string $id): void {
	$sql = "
		DELETE FROM `$table`
		WHERE id = :id
		LIMIT 1
	";
	$stmt = getCachedStmt($ctx, "del_by_$table", $sql);
	$stmt->execute([":id" => uuidToBin($id)]);
}

function pointByCoords(AppContext $ctx, float $latitude, float $longitude) {
	$sql = "
		SELECT * FROM points
		WHERE latitude = :latitude
			AND longitude = :longitude
	";
	$stmt = getCachedStmt($ctx, "point_by_coords", $sql);
	$stmt->execute([
		":latitude" => $latitude,
		":longitude" => $longitude,
	]);
	return $stmt->fetch(PDO::FETCH_ASSOC);
}

function cleanupPointIfOrphaned(AppContext $ctx, ?string $pointIdBin): void {
	if ($pointIdBin === null) return;
	$sqlCount = "
		SELECT COUNT(*) AS refcount
		FROM (
			SELECT pointid FROM places WHERE pointid = :pointid
			UNION ALL
			SELECT pointid FROM pointroute WHERE pointid = :pointid
		) t;
	";
	$pointRefsStmt = getCachedStmt($ctx, "count_point_refs", $sqlCount);
	$pointRefsStmt->execute([":pointid" => $pointIdBin]);
	$pointRefs = $pointRefsStmt->fetch(PDO::FETCH_ASSOC);

	if ((int) $pointRefs["refcount"] === 0) {
		$sqlDel = "
			DELETE FROM points
			WHERE id = :pointid
		";
		$delPointStmt = getCachedStmt($ctx, "del_orphan_point", $sqlDel);
		$delPointStmt->execute([":pointid" => $pointIdBin]);
	}
}

// SEC Images

function updateImagesOf(AppContext $ctx, array $entity, string $binEntityId) {
	if ($entity["type"] !== "place" && $entity["type"] !== "route") return;
	global $config;

	$idField = $entity["type"] === "place" ? "placeid" : "routeid";

	$keepIds = array_keys($entity["images"] ?? []);
	if (($entity["deleted"] ?? false) === true) $keepIds = [];

	if (!empty($keepIds)) {
		$keepIdsBin = array_map("uuidToBin", $keepIds);
		$placeholders = implode(",", array_fill(0, count($keepIdsBin), "?"));
		$sqlAdopt = "
			UPDATE images
			SET $idField = ?
			WHERE $idField IS NULL
				AND id IN ($placeholders)
		";
		$adoptStmt = $ctx->db->prepare($sqlAdopt);
		$adoptStmt->execute(array_merge([$binEntityId], $keepIdsBin));
	}

	$sqlSelect = "
		SELECT id, file FROM images
		WHERE $idField = :entityid
	";
	$stmt = getCachedStmt($ctx, "select_images_$idField", $sqlSelect);
	$stmt->execute([":entityid" => $binEntityId]);
	$images = $stmt->fetchAll(PDO::FETCH_ASSOC);

	foreach ($images as $img) {
		$uuid = binToUuid($img["id"]);

		if (!in_array($uuid, $keepIds, true)) {
			$sqlDelImg = "
				DELETE FROM images
				WHERE id = :id
			";
			$del = getCachedStmt($ctx, "delete_image_by_id", $sqlDelImg);
			$del->execute([":id" => $img["id"]]);
			$pathBig = $config["dirs"]["uploads"]["images"]["big"] . $img["file"];
			$pathSmall = $config["dirs"]["uploads"]["images"]["small"] . $img["file"];
			if (is_file($pathBig)) unlink($pathBig);
			if (is_file($pathSmall)) unlink($pathSmall);
		} else {
			$sqlUpdImg = "
				UPDATE images
				SET committed = 1, srt = :srt
				WHERE id = :id
			";
			$upd = getCachedStmt($ctx, "update_image_srt", $sqlUpdImg);
			$upd->execute([
				":id" => $img["id"],
				":srt" => (float) ($entity["images"][$uuid]["srt"] ?? 10.0),
			]);
		}
	}
}

// SEC Points

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
	$stmt = getCachedStmt($ctx, "add_point", $sql);
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
			location  = ST_GeomFromText(CONCAT('POINT(', :longitudeloc, ' ', :latitudeloc, ')'), 4326)
		WHERE id = :id
	";
	$stmt = getCachedStmt($ctx, "update_point", $sql);
	$stmt->execute([
		":id"           => uuidToBin($row["id"]),
		":latitude"     => $row["latitude"] ?? 0,
		":latitudeloc"  => $row["latitude"] ?? 0,
		":longitude"    => $row["longitude"] ?? 0,
		":longitudeloc" => $row["longitude"] ?? 0,
		":altitude"     => $row["altitude"] ?? null,
	]);
}

// SEC Places

function addPlace(AppContext $ctx, array $row, string $binUserId): void {
	$sql = "
		INSERT INTO places (
			id, pointid, folderid, name, description, link, time, srt, geomark, common, userid
		) VALUES (
			:id,
			:pointid,
			:folderid,
			:name,
			:description,
			:link,
			:time,
			:srt,
			:geomark,
			:common,
			:userid
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
	$stmt = getCachedStmt($ctx, "add_place", $sql);

	$binPlaceId = uuidToBin($row["id"]);
	$folderId = isset($row["folderid"]) && $row["folderid"] !== null
		? uuidToBin($row["folderid"])
		: null
	;
	$time = !empty($row["time"]) ? (int) $row["time"] : null;

	$stmt->execute([
		":id"          => $binPlaceId,
		":pointid"     => uuidToBin($row["pointid"]),
		":name"        => $row["name"] ?? "",
		":description" => $row["description"] ?? "",
		":link"        => $row["link"] ?? "",
		":time"        => $time,
		":srt"         => (float) ($row["srt"] ?? 0),
		":geomark"     => (int) ($row["geomark"] ?? 0),
		":common"      => (int) ($row["common"] ?? 0),
		":userid"      => $binUserId,
		":folderid"    => $folderId,
	]);
	updateImagesOf($ctx, $row, $binPlaceId);
}

function updatePlace(AppContext $ctx, array $row, string $binUserId): void {
	$pointIdBin = !empty($row["pointid"])
		? uuidToBin($row["pointid"])
		: null
	;
	$folderId = isset($row["folderid"]) && $row["folderid"] !== null
		? uuidToBin($row["folderid"])
		: null
	;
	$time = !empty($row["time"]) ? (int) $row["time"] : null;
	$binPlaceId = uuidToBin($row["id"]);

	if ($pointIdBin !== null) {
		$sql = "
			UPDATE places
			SET
				pointid     = :pointid,
				folderid    = :folderid,
				name        = :name,
				description = :description,
				link        = :link,
				time        = :time,
				srt         = :srt,
				geomark     = :geomark,
				common      = :common
			WHERE id = :id
				AND userid = :userid
		";
		$stmt = getCachedStmt($ctx, "update_place_with_point", $sql);
		$bindingArray = [":pointid" => $pointIdBin];
	} else {
		$sql = "
			UPDATE places
			SET
				folderid    = :folderid,
				name        = :name,
				description = :description,
				link        = :link,
				time        = :time,
				srt         = :srt,
				geomark     = :geomark,
				common      = :common
			WHERE id = :id
				AND userid = :userid
		";
		$stmt = getCachedStmt($ctx, "update_place_no_point", $sql);
		$bindingArray = [];
	}
	$bindingArray += [
		":id"          => $binPlaceId,
		":name"        => $row["name"] ?? "",
		":description" => $row["description"] ?? "",
		":link"        => $row["link"] ?? "",
		":time"        => $time,
		":srt"         => (float) ($row["srt"] ?? 0),
		":geomark"     => (int) ($row["geomark"] ?? 0),
		":common"      => (int) ($row["common"] ?? 0),
		":userid"      => $binUserId,
		":folderid"    => $folderId,
	];

	$stmt->execute($bindingArray);
	updateImagesOf($ctx, $row, $binPlaceId);
}

function deletePlace(AppContext $ctx, array $row, string $binUserId): void {
	$binPlaceId = uuidToBin($row["id"]);
	updateImagesOf($ctx, $row, $binPlaceId);
	$sql = "
		DELETE FROM places
		WHERE id = :id
			AND userid = :userid
	";
	$delPlaceStmt = getCachedStmt($ctx, "delete_place", $sql);
	$delPlaceStmt->execute([
		":id" => $binPlaceId,
		":userid" => $binUserId,
	]);
	$pointIdBin = !empty($row["pointid"]) ? uuidToBin($row["pointid"]) : null;
	cleanupPointIfOrphaned($ctx, $pointIdBin);
}

// SEC Routes

function addRoute(AppContext $ctx, array $row, string $binUserId): void {
	$idBin = uuidToBin($row["id"]);
	$folderId = isset($row["folderid"]) && $row["folderid"] !== null
		? uuidToBin($row["folderid"])
		: null
	;
	$time = !empty($row["time"]) ? (int) $row["time"] : null;

	$sqlRoute = "
		INSERT INTO routes (
			id, userid, name, description, folderid, srt, time, link, geomarks, common
		) VALUES (
			:id,
			:userid,
			:name,
			:description,
			:folderid,
			:srt,
			:time,
			:link,
			:geomarks,
			:common
		)
	";
	$stmtRoute = getCachedStmt($ctx, "add_route", $sqlRoute);
	$stmtRoute->execute([
		":id"          => $idBin,
		":userid"      => $binUserId,
		":name"        => $row["name"] ?? "",
		":description" => $row["description"] ?? "",
		":folderid"    => $folderId,
		":srt"         => (float) ($row["srt"] ?? 0),
		":time"        => $time,
		":link"        => $row["link"] ?? "",
		":geomarks"    => (int) ($row["geomarks"] ?? 0),
		":common"      => (int) ($row["common"] ?? 0),
	]);
	if (!empty($row["points"]) && is_array($row["points"])) {
		$sqlPR = "
			INSERT INTO pointroute (routeid, pointid, name, description, srt)
			VALUES (:id, :pid, :name, :description, :srt)
		";
		$insPR = getCachedStmt($ctx, "add_pointroute", $sqlPR);
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
	updateImagesOf($ctx, $row, $idBin);
}

function updateRoute(AppContext $ctx, array $row, string $binUserId): void {
	$idBin = uuidToBin($row["id"]);
	$folderId = isset($row["folderid"]) && $row["folderid"] !== null
		? uuidToBin($row["folderid"])
		: null
	;
	$time = !empty($row["time"]) ? (int) $row["time"] : null;

	$sqlRoute = "
		UPDATE routes
		SET
			name = :name,
			description = :description,
			folderid = :folderid,
			srt = :srt,
			time = :time,
			link = :link,
			geomarks = :geomarks,
			common = :common
		WHERE id = :id
			AND userid = :userid
	";
	$stmtRoute = getCachedStmt($ctx, "update_route", $sqlRoute);
	$stmtRoute->execute([
		":name"        => $row["name"] ?? "",
		":description" => $row["description"] ?? "",
		":folderid"    => $folderId,
		":srt"         => (int) ($row["srt"] ?? 0),
		":time"        => $time,
		":link"        => $row["link"] ?? "",
		":geomarks"    => (int) ($row["geomarks"] ?? 0),
		":common"      => (int) ($row["common"] ?? 0),
		":id"          => $idBin,
		":userid"      => $binUserId,
	]);
	$sqlOldPoints = "
		SELECT pointid FROM pointroute
		WHERE routeid = :id
	";
	$oldPointsStmt = getCachedStmt($ctx, "get_route_old_points", $sqlOldPoints);
	$oldPointsStmt->execute([":id" => $idBin]);
	$oldPointIds = $oldPointsStmt->fetchAll(PDO::FETCH_COLUMN);
	$sqlDelPR = "
		DELETE FROM pointroute
		WHERE routeid = :id
	";
	$delPRStmt = getCachedStmt($ctx, "delete_pointroute_by_route", $sqlDelPR);
	$delPRStmt->execute([":id" => $idBin]);

	if (!empty($row["points"]) && is_array($row["points"])) {
		$sqlPR = "
			INSERT INTO pointroute (routeid, pointid, name, description, srt)
			VALUES (:id, :pid, :name, :description, :srt)
		";
		$insPR = getCachedStmt($ctx, "add_pointroute", $sqlPR);
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
	updateImagesOf($ctx, $row, $idBin);
}

function deleteRoute(AppContext $ctx, array $row, string $binUserId): void {
	$idBin = uuidToBin($row["id"]);
	updateImagesOf($ctx, $row, $idBin);
	$sqlOldPoints = "
		SELECT pointid FROM pointroute
		WHERE routeid = :id
	";
	$routePointIdsStmt = getCachedStmt($ctx, "get_route_old_points", $sqlOldPoints);
	$routePointIdsStmt->execute([":id" => $idBin]);
	$routePointIds = $routePointIdsStmt->fetchAll(PDO::FETCH_COLUMN);
	$sqlDelPR = "
		DELETE FROM pointroute
		WHERE routeid = :id
	";
	$delPRStmt = getCachedStmt($ctx, "delete_pointroute_by_route", $sqlDelPR);
	$delPRStmt->execute([":id" => $idBin]);
	$sqlDelRoute = "
		DELETE FROM routes
		WHERE id = :id
			AND userid = :userid
	";
	$delRouteStmt = getCachedStmt($ctx, "delete_route", $sqlDelRoute);
	$delRouteStmt->execute([
		":id"     => $idBin,
		":userid" => $binUserId,
	]);
	foreach (array_unique($routePointIds) as $pointIdBin) {
		cleanupPointIfOrphaned($ctx, $pointIdBin);
	}
}

// SEC Folders

function addFolder(AppContext $ctx, array $row, string $binUserId): void {
	$sql = "
		INSERT INTO folders (
			id, parent, userid, context, name, description, srt, geomarks
		) VALUES (
			:id, :parent, :userid, :context, :name, :description, :srt, :geomarks
		)
		ON DUPLICATE KEY UPDATE
			parent      = VALUES(parent),
			context     = VALUES(context),
			name        = VALUES(name),
			description = VALUES(description),
			srt         = VALUES(srt),
			geomarks    = VALUES(geomarks)
	";
	$stmt = getCachedStmt($ctx, "add_folder", $sql);
	$stmt->execute([
		":id"          => uuidToBin($row["id"]),
		":parent"      => uuidToBin($row["parent"]),
		":userid"      => $binUserId,
		":context"     => $row["context"] ?? "places",
		":name"        => $row["name"] ?? "",
		":description" => $row["description"] ?? "",
		":srt"         => (float) ($row["srt"] ?? 0),
		":geomarks"    => (int) ($row["geomarks"] ?? 0),
	]);
}

function updateFolder(AppContext $ctx, array $row, string $binUserId): void {
	$sql = "
		UPDATE folders
		SET
			parent      = :parent,
			context     = :context,
			name        = :name,
			description = :description,
			srt         = :srt,
			geomarks    = :geomarks
		WHERE id = :id
			AND userid = :userid
	";
	$stmt = getCachedStmt($ctx, "update_folder", $sql);
	$stmt->execute([
		":id"          => uuidToBin($row["id"]),
		":parent"      => uuidToBin($row["parent"]),
		":userid"      => $binUserId,
		":context"     => $row["context"] ?? "places",
		":name"        => $row["name"] ?? "",
		":description" => $row["description"] ?? "",
		":srt"         => (float) ($row["srt"] ?? 0),
		":geomarks"    => (int) ($row["geomarks"] ?? 0),
	]);
}

// SEC Session check

if (checkSession($ctx, $data["sessionid"]) === false) {
	echo 2;
	exit();
}

// SEC Transaction

try {
	$ctx->db->beginTransaction();

	$globalBinUserId = uuidToBin($data["userid"]);
	$quotedBinUserId = $ctx->db->quote($globalBinUserId);

	$visiting = $ctx->db->query("
		SELECT `id` FROM `groups`
		WHERE `id` IN (
			SELECT `group` FROM `usergroup`
			WHERE `user` = {$quotedBinUserId}
		)
			AND `parent` = 'visiting'
	")->fetch(PDO::FETCH_ASSOC);
	$groupId = $visiting["id"] ?? null;

// SEC Transaction Points
	
	if (!empty($list["points"])) {
		$sqlDelPoint = "
			DELETE FROM points
			WHERE id = :id
		";
		$delPointStmt = getCachedStmt($ctx, "bulk_del_point", $sqlDelPoint);

		foreach ($list["points"] as $row) {
			if (!empty($row["deleted"])) {
				$delPointStmt->execute([":id" => uuidToBin($row["id"])]);
			} elseif (!empty($row["added"])) {
				addPoint($ctx, $row);
			} elseif (!empty($row["updated"])) {
				updatePoint($ctx, $row);
			}
		}
	}

// SEC Transaction Folders
	
	if (!empty($list["folders"])) {
		$sqlDelFolder = "
			DELETE FROM folders
			WHERE id = :id
				AND userid = :userid
		";
		$delFolderStmt = getCachedStmt($ctx, "bulk_del_folder", $sqlDelFolder);

		$foldersLimit = $groupId && isset($config["rights"]["folderscount"][$groupId])
			? (int) $config["rights"]["folderscount"][$groupId] : 0
		;
		$folderscount = (int) $ctx->db->query("
			SELECT COUNT(*) AS c FROM folders
			WHERE userid = {$quotedBinUserId}
		")->fetch(PDO::FETCH_ASSOC)["c"];

		foreach ($list["folders"] as $row) {
			if (!empty($row["deleted"])) {
				$delFolderStmt->execute([
					":id"     => uuidToBin($row["id"]),
					":userid" => $globalBinUserId,
				]);
			} elseif (!empty($row["added"])) {
				if ($foldersLimit >= 0 && $folderscount >= $foldersLimit) {
					if (!in_array(6, $faults, true)) $faults[] = 6;
					continue;
				}
				if ($foldersLimit >= 0) {
					$folderscount++;
				}
				addFolder($ctx, $row, $globalBinUserId);
			} elseif (!empty($row["updated"])) {
				updateFolder($ctx, $row, $globalBinUserId);
			}
		}
	}

// SEC Transaction Places

	if (!empty($list["places"])) {
		$placesLimit = $groupId && isset($config["rights"]["placescount"][$groupId])
			? (int) $config["rights"]["placescount"][$groupId] : 0
		;
		$placescount = (int) $ctx->db->query("
			SELECT COUNT(*) AS c FROM places
			WHERE userid = {$quotedBinUserId}
		")->fetch(PDO::FETCH_ASSOC)["c"];

		foreach ($list["places"] as $row) {
			if (!empty($row["deleted"])) {
				deletePlace($ctx, $row, $globalBinUserId);
			} elseif (!empty($row["added"]) && getById($ctx, "points", $row["pointid"])) {
				if ($placesLimit >= 0 && $placescount >= $placesLimit) {
					if (!in_array(4, $faults, true)) $faults[] = 4;
					continue;
				}
				$placescount++;
				addPlace($ctx, $row, $globalBinUserId);
			} elseif (!empty($row["updated"])) {
				updatePlace($ctx, $row, $globalBinUserId);
			}
		}
	}

// SEC Transaction Routes

	if (!empty($list["routes"])) {
		$routesLimit = $groupId && isset($config["rights"]["routescount"][$groupId])
			? (int) $config["rights"]["routescount"][$groupId] : 0
		;
		$routescount = (int) $ctx->db->query("
			SELECT COUNT(*) AS c FROM routes
			WHERE userid = {$quotedBinUserId}
		")->fetch(PDO::FETCH_ASSOC)["c"];

		foreach ($list["routes"] as $row) {
			if (!empty($row["deleted"])) {
				deleteRoute($ctx, $row, $globalBinUserId);
			} elseif (!empty($row["added"])) {
				if ($routesLimit >= 0 && $routescount >= $routesLimit) {
					if (!in_array(5, $faults, true)) $faults[] = 5;
					continue;
				}
				$routescount++;
				addRoute($ctx, $row, $globalBinUserId);
			} elseif (!empty($row["updated"])) {
				updateRoute($ctx, $row, $globalBinUserId);
			}
		}
	}

	$ctx->db->commit();

} catch (Throwable $e) {
	error_log($e->getMessage());
	if ($ctx->db->inTransaction()) $ctx->db->rollBack();
	if (!in_array(1, $faults, true)) $faults[] = 1;
}

header("Content-Type: application/json");
echo json_encode(
	$faults,
	JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_NUMERIC_CHECK,
);
exit();
