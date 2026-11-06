<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class ConvertEntityTypes extends AbstractMigration
{
	public function up(): void
	{
		$this->execute("SET FOREIGN_KEY_CHECKS = 0;");

		$this->execute("
			ALTER TABLE `places`
				MODIFY COLUMN `name` VARCHAR(255) NULL
		;");

		$this->execute("
			ALTER TABLE `routes`
				MODIFY COLUMN `name` VARCHAR(255) NULL,
				MODIFY COLUMN `link` VARCHAR(2044) NULL,
				MODIFY COLUMN `srt` DOUBLE NOT NULL DEFAULT 10,
				MODIFY COLUMN `description` VARCHAR(2044) NULL
		;");

		$this->execute("
			ALTER TABLE `folders`
				MODIFY COLUMN `name` VARCHAR(255) NULL,
				MODIFY COLUMN `srt` DOUBLE NOT NULL DEFAULT 10,
				MODIFY COLUMN `description` VARCHAR(2044) NULL
		;");

		$this->execute("
			ALTER TABLE `users`
				MODIFY COLUMN `name` VARCHAR(255) NULL,
				MODIFY COLUMN `email` VARCHAR(255) NULL,
				MODIFY COLUMN `phone` VARCHAR(30) NULL
		;");

		$this->execute("SET FOREIGN_KEY_CHECKS = 1;");
	}

	public function down(): void
	{
		$this->execute("SET FOREIGN_KEY_CHECKS = 0;");

		$this->execute("
			ALTER TABLE `places`
				MODIFY COLUMN `name` VARCHAR(500) NULL DEFAULT 'Без названия'
		;");

		$this->execute("
			ALTER TABLE `routes`
				MODIFY COLUMN `name` VARCHAR(500) NULL DEFAULT 'Без названия',
				MODIFY COLUMN `link` VARCHAR(512) NULL DEFAULT '',
				MODIFY COLUMN `srt` DOUBLE NULL DEFAULT 0,
				MODIFY COLUMN `description` VARCHAR(2044) NULL DEFAULT ''
		;");

		$this->execute("
			ALTER TABLE `folders`
				MODIFY COLUMN `name` VARCHAR(500) NULL DEFAULT 'Без названия',
				MODIFY COLUMN `srt` DOUBLE NULL DEFAULT 0,
				MODIFY COLUMN `description` VARCHAR(2044) NULL DEFAULT ''
		;");

		$this->execute("
			ALTER TABLE `users`
				MODIFY COLUMN `name` VARCHAR(100) NULL,
				MODIFY COLUMN `email` VARCHAR(100) NULL,
				MODIFY COLUMN `phone` VARCHAR(20) NULL
		;");

		$this->execute("SET FOREIGN_KEY_CHECKS = 1;");
	}
}
