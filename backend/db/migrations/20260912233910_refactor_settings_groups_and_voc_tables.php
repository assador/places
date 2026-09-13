<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class RefactorSettingsGroupsAndVocTables extends AbstractMigration
{
    public function up(): void
    {
        $this->execute("SET FOREIGN_KEY_CHECKS = 0;");

        $this->execute("
            ALTER TABLE `settings_users_voc` 
            MODIFY COLUMN `name` VARCHAR(255) DEFAULT ''
        ;");

        $this->execute("
            ALTER TABLE `settings_users_groups` 
            MODIFY COLUMN `name` VARCHAR(255) DEFAULT ''
        ;");

        $this->execute("
            RENAME TABLE `settings_users_groups` TO `settings_groups`
        ;");

        $this->execute("
            ALTER TABLE `settings_users`
            DROP FOREIGN KEY `1`,
            ADD CONSTRAINT `fk_settings_users_settingid`
            FOREIGN KEY (`settingid`) REFERENCES `settings_users_voc`(`id`) ON DELETE CASCADE
        ;");

        $this->execute("
            ALTER TABLE `settings_users_voc`
            DROP FOREIGN KEY `1`,
            ADD CONSTRAINT `fk_settings_users_voc_groupid`
            FOREIGN KEY (`groupid`) REFERENCES `settings_groups`(`id`) ON DELETE RESTRICT
        ;");

        $this->execute("
            ALTER TABLE `settings_groups`
            DROP FOREIGN KEY `1`,
            ADD CONSTRAINT `fk_settings_groups_parent`
            FOREIGN KEY (`parent`) REFERENCES `settings_groups`(`id`) ON DELETE RESTRICT
        ;");

        $this->execute("SET FOREIGN_KEY_CHECKS = 1;");
    }

    public function down(): void
    {
        $this->execute("SET FOREIGN_KEY_CHECKS = 0;");

        $this->execute("
            ALTER TABLE `settings_users`
            DROP FOREIGN KEY `fk_settings_users_settingid`,
            ADD CONSTRAINT `1`
            FOREIGN KEY (`settingid`) REFERENCES `settings_users_voc`(`id`) ON DELETE CASCADE
        ;");

        $this->execute("
            ALTER TABLE `settings_groups`
            DROP FOREIGN KEY `fk_settings_groups_parent`
        ;");

        $this->execute("
            ALTER TABLE `settings_users_voc`
            DROP FOREIGN KEY `fk_settings_users_voc_groupid`
        ;");

        $this->execute("
            RENAME TABLE `settings_groups` TO `settings_users_groups`
        ;");

        $this->execute("
            ALTER TABLE `settings_users_voc`
            ADD CONSTRAINT `1`
            FOREIGN KEY (`groupid`) REFERENCES `settings_users_groups`(`id`) ON DELETE RESTRICT
        ;");

        $this->execute("
            ALTER TABLE `settings_users_groups`
            ADD CONSTRAINT `1`
            FOREIGN KEY (`parent`) REFERENCES `settings_users_groups`(`id`) ON DELETE RESTRICT
        ;");

        $this->execute("
            ALTER TABLE `settings_users_voc` 
            MODIFY COLUMN `name` VARCHAR(255) NOT NULL
        ;");

        $this->execute("
            ALTER TABLE `settings_users_groups` 
            MODIFY COLUMN `name` VARCHAR(255) NOT NULL
        ;");

        $this->execute("SET FOREIGN_KEY_CHECKS = 1;");
    }
}
