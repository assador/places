<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class SetOptionsFree extends AbstractMigration
{
	public function up(): void
	{
    $this->execute("
        RENAME TABLE
            `settings_users_voc_options`
        TO
            `settings_options`
    ");

    $this->execute("
        ALTER TABLE `settings_options`
            DROP FOREIGN KEY `fk_settings_users_voc_options_settingid`,
            DROP INDEX `uq_settingid_value`,
            DROP INDEX `settingid`,
            CHANGE COLUMN `settingid` `enumid`
                SMALLINT UNSIGNED NOT NULL,
            ADD COLUMN `id`
                SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT FIRST,
            ADD PRIMARY KEY (`id`),
            ADD UNIQUE KEY `uq_enumid_value` (`enumid`, `value`),
            ADD KEY `enumid` (`enumid`)
    ");
	}

	public function down(): void
	{
    $this->execute("
        ALTER TABLE `settings_options`
            DROP PRIMARY KEY,
            DROP INDEX `uq_enumid_value`,
            DROP INDEX `enumid`,
            DROP COLUMN `id`,
            CHANGE COLUMN `enumid` `settingid`
                SMALLINT UNSIGNED NOT NULL,
            ADD UNIQUE KEY `uq_settingid_value` (`settingid`, `value`),
            ADD KEY `settingid` (`settingid`),
            ADD CONSTRAINT `fk_settings_users_voc_options_settingid`
                FOREIGN KEY (`settingid`)
                REFERENCES `settings_users_voc` (`id`)
                ON DELETE CASCADE
    ");

    $this->execute("
        RENAME TABLE
            `settings_options`
        TO
            `settings_users_voc_options`
    ");
	}
}
