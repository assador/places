<?php
include "config.php";
include "newpdo.php";

foreach($_POST as $filename) {
	if(
		unlink($dirs["uploads"]["images"]["big"] . $filename) &&
		unlink($dirs["uploads"]["images"]["small"] . $filename)
	) {
		echo "Файлы успешно удалены.\n";
	} else {
		echo "При удалении файлов произошла ошибка!\n";
	}
}
