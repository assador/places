<?php
declare(strict_types=1);
error_reporting(E_ALL);
ini_set('display_errors', '1');

require_once __DIR__ . '/bootstrap.php';

$raw = file_get_contents("php://input");
$data = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
$list = $data["data"] ?? [];

$faults = []; // 1: wrong data, 2: test account, 3: places limit, 4: folders limit

// Helpers

function checkSession(AppContext $ctx, string $sessionid): bool {
	$stmt = $ctx->db->prepare("
		SELECT * FROM `sessions`
		WHERE `id` = :sessionid
	");
	$stmt->bindValue(":sessionid", uuidToBin($sessionid), PDO::PARAM_LOB);
	$stmt->execute();
	$result = $stmt->fetchAll(PDO::FETCH_ASSOC);
	return (count($result) > 0 ? true : false);
}
function deleteById(AppContext $ctx, string $table, string $id): void {
	$sql = "DELETE FROM {$table} WHERE id = :id";
	$params = [":id" => uuidToBin($id)];
	$stmt = $ctx->db->prepare($sql);
	$stmt->execute($params);
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
		":folderid" => (
			$row["folderid"] == "root"
				? null
				: (uuidToBin($row["folderid"]) ?? null)
		),
	]);
}
function addFolder(AppContext $ctx, array $row): void {
	$sql = "
		INSERT INTO folders (id, parent, name, description, srt, geomarks, userid)
		VALUES (:id, :parent, :name, :description, :srt, :geomarks, :userid)
		ON DUPLICATE KEY UPDATE
			parent      = VALUES(parent),
			name        = VALUES(name),
			description = VALUES(description),
			srt         = VALUES(srt),
			geomarks    = VALUES(geomarks)
	";
	$stmt = $ctx->db->prepare($sql);
	$stmt->execute([
		":id"          => uuidToBin($row["id"]),
		":parent"      => uuidToBin($row["parent"]) ?? null,
		":name"        => $row["name"] ?? "",
		":description" => $row["description"] ?? "",
		":srt"         => $row["srt"] ?? 0,
		":geomarks"    => (int)($row["geomarks"] ?? 0),
		":userid"      => uuidToBin($row["userid"]),
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
			srt          = VALUES(srt),
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

// Session check

if (checkSession($ctx, $sessionid) === false) {
	echo 5; exit;
}

// Limits

$placescount  = (int)$ctx->db->query("
	SELECT COUNT(*) AS c
	FROM places
	WHERE userid = " . $ctx->db->quote(uuidToBin($data["userid"])) . "
")->fetch(PDO::FETCH_ASSOC)["c"];

$folderscount = (int)$ctx->db->query("
	SELECT COUNT(*) AS c
	FROM folders
	WHERE userid = " . $ctx->db->quote(uuidToBin($data["userid"])) . "
")->fetch(PDO::FETCH_ASSOC)["c"];

$visiting = $ctx->db->query("
	SELECT id
	FROM `groups`
	WHERE id IN (
		SELECT `group` FROM usergroup WHERE `user` = 
		" . $ctx->db->quote(uuidToBin($data["userid"])) . "
	)
		AND parent = 'visiting'
")->fetch(PDO::FETCH_ASSOC);

$groupId = $visiting["id"] ?? null;

$placesLimit = $groupId && isset($rights["placescount"][$groupId])
	? (int)$rights["placescount"][$groupId] : 0;
$foldersLimit = $groupId && isset($rights["folderscount"][$groupId])
	? (int)$rights["folderscount"][$groupId] : 0;

// Transaction

try {
	$ctx->db->beginTransaction();
	foreach ($list as $what => $dataects) {
		switch ($what) {
			case "points": {
				$delPointStmt = $ctx->db->prepare("
					DELETE FROM points
					WHERE id = :id
				");
				foreach ($dataects as $row) {
					if (!empty($row["deleted"])) {
						$delPointStmt->execute([
							":id" => uuidToBin($row["id"]),
						]);
						continue;
					}
					if (!empty($row["added"])) {
						addPoint($ctx, $row);
					}
				}
				break;
			}
			case "places": {
				// Calculate the limit deltas within the package
				$delta = 0;
				foreach ($dataects as $row) {
					if (!empty($row["deleted"])) {
						$delta--;
						$delPlaceStmt = $ctx->db->prepare("
							DELETE FROM places
							WHERE id = :id
								AND userid = :userid
						");
						$delPlaceStmt->execute([
							":id" => uuidToBin($row["id"]),
							":userid" => uuidToBin($data["userid"]),
						]);
						continue;
					}
					if (!empty($row["added"])) {
						$delta++;
						if ($placesLimit >= 0 && $placescount >= $placesLimit) {
							if (!in_array(3, $faults)) $faults[] = 3; // limit
							continue;
						}
						$placescount++;
						addPlace($ctx, $row);
						continue;
					}
					if (!empty($row["images"]) && is_array($row["images"])) {
						foreach ($row["images"] as $img) {
							addImage($ctx, $img);
						}
					}
					if (!empty($row["updated"])) {
						continue;
					}
				}
				break;
			}
			case "folders": {
				$delta = 0;
				foreach ($dataects as $row) {
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
						continue;
					}
					if (!empty($row["added"])) {
						if ($foldersLimit >= 0 && $folderscount >= $foldersLimit) {
							if (!in_array(4, $faults)) $faults[] = 4; // limit
							continue;
						}
						if ($foldersLimit >= 0) $folderscount++;
						addFolder($ctx, $row);
					}
					if (!empty($row["updated"])) {
						continue;
					}
				}
				break;
			}
			case "images_upload": {
				foreach ($dataects as $img) addImage($ctx, $img);
				break;
			}
			case "images_delete": {
				foreach ($dataects as $row) {
					deleteById($ctx, "images", $row["id"]);
				}
				break;
			}
			default:
				$faults[] = 1;
		}
	}
	$ctx->db->commit();
} catch (Throwable $e) {
	$ctx->db->rollBack();
	if (!in_array(1, $faults)) $faults[] = 1;
}
echo json_encode(
	$faults,
	JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_NUMERIC_CHECK
);
exit;
