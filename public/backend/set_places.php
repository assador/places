<?php
include "config.php";
include "newpdo.php";
include "common.php";

$_POST = json_decode(file_get_contents("php://input"), true);
$faults = [];
/*
 * 1: Something’s wrong
 * 2: Test account
 * 3: Places limit reached
 * 4: Folders limit reached
 */
function updateImages(&$conn, &$stmt, $images) {
	$stmt = $conn->prepare("
		INSERT INTO `images` (
			`id`           ,
			`file`         ,
			`size`         ,
			`type`         ,
			`lastmodified` ,
			`srt`          ,
			`placeid`
		) VALUES (
			:id            ,
			:file          ,
			:size          ,
			:type          ,
			:lastmodified  ,
			:srt           ,
			:placeid
		)
	");
	$stmt->bindParam( ":id"           , $id           );
	$stmt->bindParam( ":file"         , $file         );
	$stmt->bindParam( ":size"         , $size         );
	$stmt->bindParam( ":type"         , $type         );
	$stmt->bindParam( ":lastmodified" , $lastmodified );
	$stmt->bindParam( ":srt"          , $srt          );
	$stmt->bindParam( ":placeid"      , $placeid      );
	foreach($images as $row) {
		$id           = $row[ "id"           ];
		$file         = $row[ "file"         ];
		$size         = $row[ "size"         ];
		$type         = $row[ "type"         ];
		$lastmodified = $row[ "lastmodified" ];
		$srt          = $row[ "srt"          ];
		$placeid      = $row[ "placeid"      ];
		$stmt->execute();
	}
}
if(testAccountCheck($conn, $testaccountid, $_POST["id"])) {
	echo json_encode([2], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_NUMERIC_CHECK);
	exit;
} else {
	$images = array();
	if($_POST["what"] == "places") {
		foreach($_POST["data"] as $dval) {
			$pimg = $dval["images"];
			foreach($pimg as $ival) {
				$images[] = $ival;
			}
		}
	}
	$query = $conn->query("
		SELECT COUNT(*)
		AS `count`
		FROM `places`
		WHERE `userid` = '" . $_POST["id"] . "'"
	);
	$placescount = $query->fetch(PDO::FETCH_ASSOC);
	$query = $conn->query("
		SELECT COUNT(*)
		AS `count`
		FROM `folders`
		WHERE `userid` = '" . $_POST["id"] . "'"
	);
	$folderscount = $query->fetch(PDO::FETCH_ASSOC);
	$query = $conn->query("
		SELECT `id`
		FROM `groups`
		WHERE `id`
		IN (
			SELECT `group`
			FROM `usergroup`
			WHERE `user` = '" . $_POST["id"] . "'
		)
		AND `parent` = 'visiting'
	");
	$visiting = $query->fetch(PDO::FETCH_ASSOC);
	if($_POST["what"] == "places") {
		$delete = $conn->prepare("DELETE FROM `places` WHERE `id` = :id AND `userid` = :userid");
		$append = $conn->prepare("
			INSERT INTO `places` (
				`id`                 ,
				`folderid`           ,
				`name`               ,
				`description`        ,
				`link`               ,
				`latitude`           ,
				`longitude`          ,
				`altitudecapability` ,
				`time`               ,
				`srt`                ,
				`geomark`            ,
				`common`             ,
				`userid`
			) VALUES (
				:id                 ,
				:folderid           ,
				:name               ,
				:description        ,
				:link               ,
				:latitude           ,
				:longitude          ,
				:altitudecapability ,
				:time               ,
				:srt                ,
				:geomark            ,
				:common             ,
				:userid
			)
		");
		$update = $conn->prepare("
			UPDATE `places` SET
				`id`                 = :id                 ,
				`folderid`           = :folderid           ,
				`name`               = :name               ,
				`description`        = :description        ,
				`link`               = :link               ,
				`latitude`           = :latitude           ,
				`longitude`          = :longitude          ,
				`altitudecapability` = :altitudecapability ,
				`time`               = :time               ,
				`srt`                = :srt                ,
				`geomark`            = :geomark            ,
				`common`             = :common             ,
				`userid`             = :userid
			WHERE `id` = :id
		");
		$updateimage = $conn->prepare("
			UPDATE `images` SET
				`id`           = :id           ,
				`file`         = :file         ,
				`size`         = :size         ,
				`type`         = :type         ,
				`lastmodified` = :lastmodified ,
				`srt`          = :srt          ,
				`placeid`      = :placeid
			WHERE `id` = :id
		");
		foreach($_POST["data"] as $row) {
			if($row["deleted"] == true) {
				$delete->bindParam( ":id"     , $row["id"]);
				$delete->bindParam( ":userid" , $_POST["id"]);
				try {
					$delete->execute();
					$placescount["count"]--;
				} catch(Exception $e) {
					error_log($e);
					continue;
				}
			} elseif($row["added"] == true) {
				if(
					$placescount["count"] < $rights["placescount"][$visiting["id"]]
					|| $rights["placescount"][$visiting["id"]] < 0
				) {
					$append->bindParam( ":id"                 , $row[ "id"                 ]);
					$append->bindParam( ":folderid"           , $row[ "folderid"           ]);
					$append->bindParam( ":name"               , $row[ "name"               ]);
					$append->bindParam( ":description"        , $row[ "description"        ]);
					$append->bindParam( ":link"               , $row[ "link"               ]);
					$append->bindParam( ":latitude"           , $row[ "latitude"           ]);
					$append->bindParam( ":longitude"          , $row[ "longitude"          ]);
					$append->bindParam( ":altitudecapability" , $row[ "altitudecapability" ]);
					$append->bindParam( ":time"               , $row[ "time"               ]);
					$append->bindParam( ":srt"                , $row[ "srt"                ]);
					$append->bindParam( ":geomark"            , $row[ "geomark"            ]);
					$append->bindParam( ":common"             , $row[ "common"             ]);
					$append->bindParam( ":userid"             , $_POST["id"]);
					try {
						$append->execute();
						$placescount["count"]++;
					} catch(Exception $e) {
						error_log($e);
						continue;
					}
				} else {
					if(!in_array(3, $faults)) {$faults[] = 3;}
				}
			}
			if($row["updated"] == true) {
				$update->bindParam( ":id"                 , $row[ "id"                 ]);
				$update->bindParam( ":folderid"           , $row[ "folderid"           ]);
				$update->bindParam( ":name"               , $row[ "name"               ]);
				$update->bindParam( ":description"        , $row[ "description"        ]);
				$update->bindParam( ":link"               , $row[ "link"               ]);
				$update->bindParam( ":latitude"           , $row[ "latitude"           ]);
				$update->bindParam( ":longitude"          , $row[ "longitude"          ]);
				$update->bindParam( ":altitudecapability" , $row[ "altitudecapability" ]);
				$update->bindParam( ":time"               , $row[ "time"               ]);
				$update->bindParam( ":srt"                , $row[ "srt"                ]);
				$update->bindParam( ":geomark"            , $row[ "geomark"            ]);
				$update->bindParam( ":common"             , $row[ "common"             ]);
				$update->bindParam( ":userid"             , $_POST["id"]);
				try {$update->execute();} catch(Exception $e) {
					error_log($e);
					continue;
				}
			}
			foreach($row["images"] as $image) {
				$updateimage->bindParam( ":id"           , $image["id"           ]);
				$updateimage->bindParam( ":file"         , $image["file"         ]);
				$updateimage->bindParam( ":size"         , $image["size"         ]);
				$updateimage->bindParam( ":type"         , $image["type"         ]);
				$updateimage->bindParam( ":lastmodified" , $image["lastmodified" ]);
				$updateimage->bindParam( ":srt"          , $image["srt"          ]);
				$updateimage->bindParam( ":placeid"      , $image["placeid"      ]);
				try {$updateimage->execute();} catch(Exception $e) {
					error_log($e);
					continue;
				}
			}
		}
	} elseif($_POST["what"] == "folders") {
		$delete = $conn->prepare("DELETE FROM `folders` WHERE `id` = :id AND `userid` = :userid");
		$append = $conn->prepare("
			INSERT INTO `folders` (
				`id`          ,
				`parent`      ,
				`name`        ,
				`description` ,
				`srt`         ,
				`geomarks`    ,
				`userid`
			) VALUES (
				:id           ,
				:parent       ,
				:name         ,
				:description  ,
				:srt          ,
				:geomarks     ,
				:userid
			)
		");
		$update = $conn->prepare("
			UPDATE `folders` SET
				`id`          = :id          ,
				`parent`      = :parent      ,
				`name`        = :name        ,
				`description` = :description ,
				`srt`         = :srt         ,
				`geomarks`    = :geomarks    ,
				`userid`      = :userid
			WHERE `id` = :id
		");
		foreach($_POST["data"] as $row) {
			if($row["deleted"] == true) {
				$delete->bindParam( ":id"          , $row[ "id"          ]);
				$delete->bindParam( ":userid"      , $_POST["id"]);
				try {
					$delete->execute();
					$folderscount["count"]--;
				} catch(Exception $e) {
					error_log($e);
					continue;
				}
			} elseif($row["added"] == true) {
				if(
					$folderscount["count"] < $rights["folderscount"][$visiting["id"]]
					|| $rights["folderscount"][$visiting["id"]] < 0
				) {
					$append->bindParam( ":id"          , $row[ "id"          ]);
					$append->bindParam( ":parent"      , $row[ "parent"      ]);
					$append->bindParam( ":name"        , $row[ "name"        ]);
					$append->bindParam( ":description" , $row[ "description" ]);
					$append->bindParam( ":srt"         , $row[ "srt"         ]);
					$append->bindParam( ":geomarks"    , $row[ "geomarks"    ]);
					$append->bindParam( ":userid"      , $_POST["id"]);
					try {
						$append->execute();
						$folderscount["count"]++;
					} catch(Exception $e) {
						error_log($e);
						continue;
					}
				} else {
					if(!in_array(4, $faults)) {$faults[] = 4;}
				}
			}
			if($row["updated"] == true) {
				$update->bindParam( ":id"          , $row[ "id"          ]);
				$update->bindParam( ":parent"      , $row[ "parent"      ]);
				$update->bindParam( ":name"        , $row[ "name"        ]);
				$update->bindParam( ":description" , $row[ "description" ]);
				$update->bindParam( ":srt"         , $row[ "srt"         ]);
				$update->bindParam( ":geomarks"    , $row[ "geomarks"    ]);
				$update->bindParam( ":userid"      , $_POST["id"]);
				try {$update->execute();} catch(Exception $e) {
					error_log($e);
					continue;
				}
			}
		}
	} elseif($_POST["what"] == "images_upload") {
		updateImages($conn, $stmt, $_POST["data"]);
	} elseif($_POST["what"] == "images_delete") {
		$ids = "";
		foreach($_POST["data"] as $row) {
			$ids .= "'{$row["id"]}',";
		}
		$ids = rtrim($ids, ",");
		$stmt = $conn->prepare("DELETE FROM `images` WHERE `id` IN (" . $ids . ")");
		try {$stmt->execute();} catch(Exception $e) {error_log($e);}
	}
	echo json_encode($faults, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_NUMERIC_CHECK);
	exit;
}
