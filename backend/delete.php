<?php
include "config.php";
include "newpdo.php";
include "common.php";

print_r($_POST);
if(testAccountCheck($conn, $testaccountid, $_POST["userid"])) {
	echo 2; exit;
} else {
	foreach($_POST as $key => $value) {
		if($key != "userid") {
			unlink($dirs["uploads"]["images"]["big"] . $value);
			unlink($dirs["uploads"]["images"]["small"] . $value);
		}
	}
	echo 1; exit;
}
