<?php
include "config.php";
include "newpdo.php";

$data = json_decode($_POST["data"]);

$images = array();
foreach($data as $dval) {
	foreach($dval->{"images"} as $ival) {
		$images[] = $ival;
	}
}

function updateImages(&$conn, &$stmt, $images) {
	$stmt = $conn->prepare("
		INSERT INTO `images` (
			`id`           ,
			`file`         ,
			`size`         ,
			`type`         ,
			`lastmodified` ,
			`srt`          ,
			`places_id`
		) VALUES (
			:id            ,
			:file          ,
			:size          ,
			:type          ,
			:lastmodified  ,
			:srt           ,
			:places_id 
		)
	");
	$stmt->bindParam( ":id"           , $id           );
	$stmt->bindParam( ":file"         , $file         );
	$stmt->bindParam( ":size"         , $size         );
	$stmt->bindParam( ":type"         , $type         );
	$stmt->bindParam( ":lastmodified" , $lastmodified );
	$stmt->bindParam( ":srt"          , $srt          );
	$stmt->bindParam( ":places_id"    , $places_id    );
	foreach($images as $row) {
		$id           = $row->{ "id"           };
		$file         = $row->{ "file"         };
		$size         = $row->{ "size"         };
		$type         = $row->{ "type"         };
		$lastmodified = $row->{ "lastmodified" };
		$srt          = $row->{ "srt"          };
		$places_id    = $row->{ "places_id"    };
		$stmt->execute();
	}
}

if($_POST["todo"] == "places") {
	$query = $conn->query("TRUNCATE TABLE `places`");
	$stmt = $conn->prepare("
		INSERT INTO `places` (
			`name`        ,
			`description` ,
			`latitude`    ,
			`longitude`   ,
			`id`          ,
			`srt`
		) VALUES (
			:name         ,
			:description  ,
			:latitude     ,
			:longitude    ,
			:id           ,
			:srt
		)
	");
	$stmt->bindParam( ":name"        , $name        );
	$stmt->bindParam( ":description" , $description );
	$stmt->bindParam( ":latitude"    , $latitude    );
	$stmt->bindParam( ":longitude"   , $longitude   );
	$stmt->bindParam( ":id"          , $id          );
	$stmt->bindParam( ":srt"         , $srt         );
	foreach($data as $row) {
		$name        = $row->{ "name"        };
		$description = $row->{ "description" };
		$latitude    = $row->{ "latitude"    };
		$longitude   = $row->{ "longitude"   };
		$id          = $row->{ "id"          };
		$srt         = $row->{ "srt"         };
		$stmt->execute();
	}
	$query = $conn->query("TRUNCATE TABLE `images`");
	updateImages($conn, $stmt, $images);
} elseif($_POST["todo"] == "images_upload") {
	updateImages($conn, $stmt, $data);
} elseif($_POST["todo"] == "images_delete") {
	$stmt = $conn->prepare("
		DELETE FROM `images` WHERE `id` IN (:ids)
	");
	$stmt->bindParam(":ids" , $ids);
	$ids = "";
	foreach($data as $row) {
		$ids .= $row->{"id"} . ",";
	}
	$ids = rtrim($ids, ",");
	$stmt->execute();
}
