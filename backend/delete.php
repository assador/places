<?php
require_once __DIR__ . '/bootstrap.php';

if (testAccountCheck($ctx, $config["testaccountuuid"], $_POST["userid"])) {
	echo 2; exit;
}
foreach($_POST as $key => $value) {
	if($key != "userid") {
		rename(
			$config["dirs"]["uploads"]["images"]["small"]          . $value,
			$config["dirs"]["uploads"]["images"]["orphaned_small"] . $value
		);
		rename(
			$config["dirs"]["uploads"]["images"]["big"]          . $value,
			$config["dirs"]["uploads"]["images"]["orphaned_big"] . $value
		);
	}
}
echo 1; exit;
