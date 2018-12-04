<?php
include "config.php";
include "newpdo.php";
include "common.php";

if(testAccountCheck($conn, $testaccountid, $_POST["userid"])) {
	echo 2; exit;
} else {
	foreach($_FILES as $key => $file) {
		if($_FILES[$key]["error"] == UPLOAD_ERR_OK) {
			preg_match("/(.*)_([^_]+)$/", $key, $matches);
			$name = $matches[1];
			$ext = $matches[2];
			$imagick = new Imagick($_FILES[$key]["tmp_name"]);
			if(
				$imagick->getImageWidth() > $images["big"]["width"] ||
				$imagick->getImageHeight() > $images["big"]["height"]
			) {
				$imagick->resizeImage(
					$images["big"]["width"],
					$images["big"]["height"],
					Imagick::FILTER_LANCZOS, 1, true
				);
				$imagick->writeImage($dirs["uploads"]["images"]["big"] . $name . "." . $ext);
			} else {
				move_uploaded_file(
					$_FILES[$key]["tmp_name"],
					$dirs["uploads"]["images"]["big"] . $name . "." . $ext
				);
			}
			$imagick->resizeImage(
				$images["small"]["width"],
				$images["small"]["height"],
				Imagick::FILTER_LANCZOS, 1, true
			);
			$imagick->writeImage($dirs["uploads"]["images"]["small"] . $name . "." . $ext);
			$imagick->destroy();
		}
	}
	echo 1; exit;
}
