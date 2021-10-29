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
if (testAccountCheck($conn, $testaccountid, $_POST["id"])) {
	echo json_encode([2], JSON_UNESCAPED_UNICODE);
	exit;
} else {
	if (
		!isset($_POST["id"])
	) {
		echo json_encode([1], JSON_UNESCAPED_UNICODE);
		exit;
	}
	if (
		!isset($_POST["data"]["places"]) ||
		!is_array($_POST["data"]["places"])
	) {
		$_POST["data"]["places"] = [];
	}
	if (
		!isset($_POST["data"]["folders"]) ||
		!is_array($_POST["data"]["folders"])
	) {
		$_POST["data"]["folders"] = [];
	}
	$deleteimages = $conn->prepare("
		DELETE FROM `images` WHERE `placeid` IN (
			SELECT `id` FROM `places` WHERE `userid` = :userid
		)
	");
	$deleteplaces = $conn->prepare("
		DELETE FROM `places` WHERE `userid` = :userid
	");
	$deletefolders = $conn->prepare("
		DELETE FROM `folders` WHERE `userid` = :userid
	");
	$appendimage = $conn->prepare("
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
	$appendplace = $conn->prepare("
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
	$appendfolder = $conn->prepare("
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
	$query = $conn->query("
		SELECT * FROM `images` AS `i` WHERE `i`.`placeid` IN (
			SELECT `p`.`id` FROM `places` AS `p` WHERE `p`.`userid` = '" . $_POST["id"] . "'
		)
	");
	$images_db = $query->fetchAll(PDO::FETCH_ASSOC);
	$images = array();
	foreach ($_POST["data"]["places"] as $dval) {
		$pimg = $dval["images"];
		foreach ($pimg as $ival) {
			$images[] = $ival;
		}
	}
	foreach ($images as $row) {
		$found = false;
		foreach ($images_db as $row_db) {
			if ($row_db["id"] == $row["id"]) {
				$found = true;
				break;
			}
		}
		if (!$found) {
			try {
				rename(
					$dirs["uploads"]["images"]["orphaned_small"] . $row["file"],
					$dirs["uploads"]["images"]["small"]          . $row["file"]
				);
				rename(
					$dirs["uploads"]["images"]["orphaned_big"] . $row["file"],
					$dirs["uploads"]["images"]["big"]          . $row["file"]
				);
			} catch (Exception $e) {
				error_log($e);
				continue;
			}
		}
	}
	foreach ($images_db as $row_db) {
		$found = false;
		foreach ($images as $row) {
			if ($row["id"] == $row_db["id"]) {
				$found = true;
				break;
			}
		}
		if (!$found) {
			try {
				rename(
					$dirs["uploads"]["images"]["small"]          . $row_db["file"],
					$dirs["uploads"]["images"]["orphaned_small"] . $row_db["file"]
				);
				rename(
					$dirs["uploads"]["images"]["big"]          . $row_db["file"],
					$dirs["uploads"]["images"]["orphaned_big"] . $row_db["file"]
				);
			} catch (Exception $e) {
				error_log($e);
				continue;
			}
		}
	}
	$deleteimages->bindParam(":userid", $_POST["id"]);
	$deleteplaces->bindParam(":userid", $_POST["id"]);
	$deletefolders->bindParam(":userid", $_POST["id"]);
	try {$deleteimages->execute();} catch (Exception $e) {error_log($e);}
	try {$deleteplaces->execute();} catch (Exception $e) {error_log($e);}
	try {$deletefolders->execute();} catch (Exception $e) {error_log($e);}
	$placescount = 0;
	$folderscount = 0;
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
	foreach ($_POST["data"]["folders"] as $row) {
		if (
			$folderscount < $rights["folderscount"][$visiting["id"]]
			|| $rights["folderscount"][$visiting["id"]] < 0
		) {
			$appendfolder->bindParam( ":id"          , $row[ "id"          ]);
			$appendfolder->bindParam( ":parent"      , $row[ "parent"      ]);
			$appendfolder->bindParam( ":name"        , $row[ "name"        ]);
			$appendfolder->bindParam( ":description" , $row[ "description" ]);
			$appendfolder->bindParam( ":srt"         , $row[ "srt"         ]);
			$appendfolder->bindParam( ":geomarks"    , $row[ "geomarks"    ]);
			$appendfolder->bindParam( ":userid"      , $_POST["id"]);
			try {
				$appendfolder->execute();
				$folderscount++;
			} catch (Exception $e) {
				error_log($e);
				continue;
			}
		} else {
			if (!in_array(4, $faults)) {$faults[] = 4;}
			break;
		}
	}
	foreach ($_POST["data"]["places"] as $row) {
		if (
			$placescount < $rights["placescount"][$visiting["id"]]
			|| $rights["placescount"][$visiting["id"]] < 0
		) {
			$appendplace->bindParam( ":id"                 , $row[ "id"                 ]);
			$appendplace->bindParam( ":folderid"           , $row[ "folderid"           ]);
			$appendplace->bindParam( ":name"               , $row[ "name"               ]);
			$appendplace->bindParam( ":description"        , $row[ "description"        ]);
			$appendplace->bindParam( ":link"               , $row[ "link"               ]);
			$appendplace->bindParam( ":latitude"           , $row[ "latitude"           ]);
			$appendplace->bindParam( ":longitude"          , $row[ "longitude"          ]);
			$appendplace->bindParam( ":altitudecapability" , $row[ "altitudecapability" ]);
			$appendplace->bindParam( ":time"               , $row[ "time"               ]);
			$appendplace->bindParam( ":srt"                , $row[ "srt"                ]);
			$appendplace->bindParam( ":geomark"            , $row[ "geomark"            ]);
			$appendplace->bindParam( ":common"             , $row[ "common"             ]);
			$appendplace->bindParam( ":userid"             , $_POST["id"]);
			try {
				$appendplace->execute();
				$placescount++;
			} catch (Exception $e) {
				error_log($e);
				continue;
			}
		} else {
			if (!in_array(3, $faults)) {$faults[] = 3;}
			break;
		}
	}
	foreach ($images as $row) {
		$appendimage->bindParam( ":id"           , $row[ "id"           ]);
		$appendimage->bindParam( ":file"         , $row[ "file"         ]);
		$appendimage->bindParam( ":size"         , $row[ "size"         ]);
		$appendimage->bindParam( ":type"         , $row[ "type"         ]);
		$appendimage->bindParam( ":lastmodified" , $row[ "lastmodified" ]);
		$appendimage->bindParam( ":srt"          , $row[ "srt"          ]);
		$appendimage->bindParam( ":placeid"      , $row[ "placeid"      ]);
		try {$appendimage->execute();} catch (Exception $e) {
			error_log($e);
			continue;
		}
	}
	echo json_encode($faults, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_NUMERIC_CHECK);
	exit;
}
