<?php
include "config.php";
include "newpdo.php";

foreach($_FILES as $key => $file) {
	if(move_uploaded_file(
		$_FILES[$key]["tmp_name"],
		$dirs["upload"]["images"]["big"] . $_FILES[$key]["name"]
	)) {
		$thumb = new Imagick($dirs["upload"]["images"]["big"] . $_FILES[$key]["name"]);
		$thumb->resizeImage(220, 220, Imagick::FILTER_LANCZOS, 1, true);
		$thumb->writeImage($dirs["upload"]["images"]["small"] . $_FILES[$key]["name"]);
		$thumb->destroy();
		echo "Файл корректен и был успешно загружен.\n";
	} else {
		echo "Возможная атака с помощью файловой загрузки!\n";
	}
}
