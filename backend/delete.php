<?php
require_once __DIR__ . '/bootstrap.php';

if (testAccountCheck($ctx, $testaccountuuid, $_POST["userid"])) {
	echo 2; exit;
}
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
