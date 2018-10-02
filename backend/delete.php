<?php
include "config.php";
include "newpdo.php";
include "common.php";

if(testAccountCheck($conn, $testaccountid, $_POST["userid"])) {
	echo 2; exit;
} else {
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
	echo 1; exit;
}
