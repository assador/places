<?php
include "config.php";
include "newpdo.php";

foreach($_POST as $filename) {
	if(
		unlink($dirs["upload"]["images"]["big"] . $filename) &&
		unlink($dirs["upload"]["images"]["small"] . $filename)
	) {
		echo "Файлы успешно удалены.\n";
	} else {
		echo "При удалении файлов произошла ошибка!\n";
	}
}
