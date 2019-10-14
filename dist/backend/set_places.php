<?php
include "config.php";
include "newpdo.php";
include "common.php";

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
	echo 2; exit;
} else {
	$data = json_decode($_POST["data"], true);
	$images = array();
	if($_POST["todo"] == "places") {
		foreach($data as $dval) {
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
	if($_POST["todo"] == "places") {
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
		foreach($data as $row) {
			if($row["deleted"] == true) {
				$delete->bindParam( ":id"     , $row["id"]);
				$delete->bindParam( ":userid" , $_POST["id"]);
				try {$delete->execute();} catch(Exception $e) {}
			} elseif($row["added"] == true) {
				if(
					$placescount["count"] < $rights["placescounts"][$visiting["id"]]
					|| $rights["placescounts"][$visiting["id"]] < 0
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
					$append->bindParam( ":common"             , $row[ "common"             ]);
					$append->bindParam( ":userid"             , $_POST["id"]);
					try {$append->execute();} catch(Exception $e) {}
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
				$update->bindParam( ":common"             , $row[ "common"             ]);
				$update->bindParam( ":userid"             , $_POST["id"]);
				try {$update->execute();} catch(Exception $e) {}
			}
			foreach($row["images"] as $image) {
				$updateimage->bindParam( ":id"           , $image["id"           ]);
				$updateimage->bindParam( ":file"         , $image["file"         ]);
				$updateimage->bindParam( ":size"         , $image["size"         ]);
				$updateimage->bindParam( ":type"         , $image["type"         ]);
				$updateimage->bindParam( ":lastmodified" , $image["lastmodified" ]);
				$updateimage->bindParam( ":srt"          , $image["srt"          ]);
				$updateimage->bindParam( ":placeid"      , $image["placeid"      ]);
				try {$updateimage->execute();} catch(Exception $e) {}
			}
		}
	} elseif($_POST["todo"] == "folders") {
		$delete = $conn->prepare("DELETE FROM `folders` WHERE `id` = :id AND `userid` = :userid");
		$append = $conn->prepare("
			INSERT INTO `folders` (
				`id`          ,
				`parent`      ,
				`name`        ,
				`description` ,
				`srt`         ,
				`userid`
			) VALUES (
				:id           ,
				:parent       ,
				:name         ,
				:description  ,
				:srt          ,
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
				`userid`      = :userid
			WHERE `id` = :id
		");
		foreach($data as $row) {
			if($row["deleted"] == true) {
				$delete->bindParam( ":id"          , $row[ "id"          ]);
				$delete->bindParam( ":userid"      , $_POST["id"]);
				try {$delete->execute();} catch(Exception $e) {}
			} elseif($row["added"] == true) {
				if(
					$folderscount["count"] < $rights["folderscounts"][$visiting["id"]]
					|| $rights["folderscounts"][$visiting["id"]] < 0
				) {
					$append->bindParam( ":id"          , $row[ "id"          ]);
					$append->bindParam( ":parent"      , $row[ "parent"      ]);
					$append->bindParam( ":name"        , $row[ "name"        ]);
					$append->bindParam( ":description" , $row[ "description" ]);
					$append->bindParam( ":srt"         , $row[ "srt"         ]);
					$append->bindParam( ":userid"      , $_POST["id"]);
					try {$append->execute();} catch(Exception $e) {}
				}
			}
			if($row["updated"] == true) {
				$update->bindParam( ":id"          , $row[ "id"          ]);
				$update->bindParam( ":parent"      , $row[ "parent"      ]);
				$update->bindParam( ":name"        , $row[ "name"        ]);
				$update->bindParam( ":description" , $row[ "description" ]);
				$update->bindParam( ":srt"         , $row[ "srt"         ]);
				$update->bindParam( ":userid"      , $_POST["id"]);
				try {$update->execute();} catch(Exception $e) {}
			}
		}
	} elseif($_POST["todo"] == "images_upload") {
		updateImages($conn, $stmt, $data);
	} elseif($_POST["todo"] == "images_delete") {
		$ids = "";
		foreach($data as $row) {
			$ids .= "'{$row["id"]}',";
		}
		$ids = rtrim($ids, ",");
		$stmt = $conn->prepare("
			DELETE FROM `images` WHERE `id` IN (" . $ids . ")
		");
		try {$stmt->execute();} catch(Exception $e) {}
	}
	echo 1; exit;
}
