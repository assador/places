<?php
include "config.php";
include "newpdo.php";

foreach($_FILES as $key => $file) {
	$name = preg_replace("/(.*)_([^_]+)$/", "$1.$2", $key);
	$name = preg_replace("/\_$/", "", $name);
	if(move_uploaded_file(
		$_FILES[$key]["tmp_name"],
		$dirs["upload"]["images"]["big"] . $name
	)) {
		$thumb = new Imagick($dirs["upload"]["images"]["big"] . $name);
		$thumb->resizeImage(220, 220, Imagick::FILTER_LANCZOS, 1, true);
		$thumb->writeImage($dirs["upload"]["images"]["small"] . $name);
		$thumb->destroy();
	}
}
