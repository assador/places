<?php
include 'config.php';
$lengths = array(
	"name"        => 500,
	"description" => 5000,
	"image"       => 2048
);
function empty2null($variable) {
	return (trim($variable) == '') ? NULL : $variable;
}
$conn = new PDO('mysql:host=' . $db['host'] . ';dbname=' . $db['name'] . ';charset=' . $db['charset'], $db['username'], $db['password']);
$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
if(isset($_POST["places"])) {
	$query = $conn->query("TRUNCATE TABLE `places`");
	$places = json_decode($_POST["places"]);
	$stmt = $conn->prepare("
		INSERT INTO `places` (
			`name`        ,
			`description` ,
			`latitude`    ,
			`longitude`   ,
			`id`          ,
			`srt`         ,
			`image`
		) VALUES (
			:name         ,
			:description  ,
			:latitude     ,
			:longitude    ,
			:id           ,
			:srt          ,
			:image
		)
	");
	$stmt->bindParam( ':name'        , $name        );
	$stmt->bindParam( ':description' , $description );
	$stmt->bindParam( ':latitude'    , $latitude    );
	$stmt->bindParam( ':longitude'   , $longitude   );
	$stmt->bindParam( ':id'          , $id          );
	$stmt->bindParam( ':srt'         , $srt         );
	$stmt->bindParam( ':image'       , $image       );
	foreach($places as $row) {
		$name        = $row->{ 'name'        };
		$description = $row->{ 'description' };
		$latitude    = $row->{ 'latitude'    };
		$longitude   = $row->{ 'longitude'   };
		$id          = $row->{ 'id'          };
		$srt         = $row->{ 'srt'         };
		$image       = $row->{ 'image'       };
		$stmt->execute();
	}
}
