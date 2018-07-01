<?php
include 'config.php';
include 'newpdo.php';

if(isset($_POST["places"])) {
	$places = json_decode($_POST["places"]);
	var_dump($places);
	foreach($places as $places_key => $places_value) {
		if(array_key_exists("images", $places_value)) {
			foreach($places_value->{"images"} as $image_key => $image_value) {
				$images[] = $image_value;
			}
		}
	}
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
	$stmt->bindParam( ':name'        , $name        );
	$stmt->bindParam( ':description' , $description );
	$stmt->bindParam( ':latitude'    , $latitude    );
	$stmt->bindParam( ':longitude'   , $longitude   );
	$stmt->bindParam( ':id'          , $id          );
	$stmt->bindParam( ':srt'         , $srt         );
	foreach($places as $row) {
		$name        = $row->{ 'name'        };
		$description = $row->{ 'description' };
		$latitude    = $row->{ 'latitude'    };
		$longitude   = $row->{ 'longitude'   };
		$id          = $row->{ 'id'          };
		$srt         = $row->{ 'srt'         };
		$stmt->execute();
	}
	$query = $conn->query("TRUNCATE TABLE `images`");
	$stmt = $conn->prepare("
		INSERT INTO `images` (
			`id`               ,
			`file`             ,
			`size`             ,
			`type`             ,
			`lastmodified`     ,
			`places_id`
		) VALUES (
			:id                ,
			:file              ,
			:size              ,
			:type              ,
			:lastmodified      ,
			:places_id
		)
	");
	$stmt->bindParam( ':id'               , $id               );
	$stmt->bindParam( ':file'             , $file             );
	$stmt->bindParam( ':size'             , $size             );
	$stmt->bindParam( ':type'             , $type             );
	$stmt->bindParam( ':lastmodified'     , $lastmodified     );
	$stmt->bindParam( ':places_id'        , $places_id        );
	foreach($images as $row) {
		$id               = $row->{ 'id'               };
		$file             = $row->{ 'file'             };
		$size             = $row->{ 'size'             };
		$type             = $row->{ 'type'             };
		$lastmodified     = $row->{ 'lastmodified'     };
		$places_id        = $row->{ 'places_id'        };
		$stmt->execute();
	}
}
