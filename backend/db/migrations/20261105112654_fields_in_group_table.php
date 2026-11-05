<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class FieldsInGroupTable extends AbstractMigration
{
	public function up(): void
	{
		$this->execute("SET FOREIGN_KEY_CHECKS = 0;");

		$this->execute("
			ALTER TABLE `groups`
				MODIFY COLUMN `name` VARCHAR(255) NULL,
				MODIFY COLUMN `description` VARCHAR(2044) NULL
		;");

		$this->execute("
			ALTER TABLE `places`
				MODIFY COLUMN `link` VARCHAR(512) NULL,
				MODIFY COLUMN `srt` DOUBLE NOT NULL DEFAULT 10,
				MODIFY COLUMN `description` VARCHAR(2044) NULL
		;");

		$this->execute("SET FOREIGN_KEY_CHECKS = 1;");
	}

	public function down(): void
	{
		$this->execute("SET FOREIGN_KEY_CHECKS = 0;");

		$this->execute("
			ALTER TABLE `groups`
				MODIFY COLUMN `name` VARCHAR(500) NOT NULL,
				MODIFY COLUMN `description` VARCHAR(2044) NOT NULL DEFAULT ''
		;");

		$this->execute("
			ALTER TABLE `places`
				MODIFY COLUMN `link` VARCHAR(512) NULL DEFAULT '',
				MODIFY COLUMN `srt` DOUBLE NULL DEFAULT 0,
				MODIFY COLUMN `description` VARCHAR(2044) NULL DEFAULT ''
		;");

		$this->execute("SET FOREIGN_KEY_CHECKS = 1;");
	}
}
