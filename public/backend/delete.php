<?php
include "config.php";
include "newpdo.php";
include "common.php";

if(testAccountCheck($conn, $testaccountid, $_POST["userid"])) {
	echo 2; exit;
} else {
	foreach($_POST as $key => $value) {
		if($key != "userid") {
			rename(
				$dirs["uploads"]["images"]["small"]          . $value,
				$dirs["uploads"]["images"]["orphaned_small"] . $value
			);
			rename(
				$dirs["uploads"]["images"]["big"]          . $value,
				$dirs["uploads"]["images"]["orphaned_big"] . $value
			);
		}
	}
	echo 1; exit;
}
