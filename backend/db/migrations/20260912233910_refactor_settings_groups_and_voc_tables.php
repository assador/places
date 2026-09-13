<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class RefactorSettingsGroupsAndVocTables extends AbstractMigration
{
    private function dropForeignKeyToTable(string $table, string $referencedTable): void
    {
        $rows = $this->fetchAll("
            SELECT CONSTRAINT_NAME 
            FROM information_schema.KEY_COLUMN_USAGE 
            WHERE TABLE_SCHEMA = DATABASE() 
              AND TABLE_NAME = '{$table}' 
              AND REFERENCED_TABLE_NAME = '{$referencedTable}'
        ");

        foreach ($rows as $row) {
            $fk = $row['CONSTRAINT_NAME'];
            $this->execute("ALTER TABLE `{$table}` DROP FOREIGN KEY `{$fk}`");
        }
    }

    public function up(): void
    {
        $this->execute("SET FOREIGN_KEY_CHECKS = 0;");

        $this->execute("ALTER TABLE `settings_users_voc` MODIFY COLUMN `name` VARCHAR(255) DEFAULT '';");
        $this->execute("ALTER TABLE `settings_users_groups` MODIFY COLUMN `name` VARCHAR(255) DEFAULT '';");

        $this->dropForeignKeyToTable('settings_users', 'settings_users_voc');
        $this->dropForeignKeyToTable('settings_users_voc', 'settings_users_groups');
        $this->dropForeignKeyToTable('settings_users_groups', 'settings_users_groups');

        $this->execute("RENAME TABLE `settings_users_groups` TO `settings_groups`;");

        $this->execute("
            ALTER TABLE `settings_users`
            ADD CONSTRAINT `fk_settings_users_settingid`
            FOREIGN KEY (`settingid`) REFERENCES `settings_users_voc`(`id`) ON DELETE CASCADE
        ;");

        $this->execute("
            ALTER TABLE `settings_users_voc`
            ADD CONSTRAINT `fk_settings_users_voc_groupid`
            FOREIGN KEY (`groupid`) REFERENCES `settings_groups`(`id`) ON DELETE RESTRICT
        ;");

        $this->execute("
            ALTER TABLE `settings_groups`
            ADD CONSTRAINT `fk_settings_groups_parent`
            FOREIGN KEY (`parent`) REFERENCES `settings_groups`(`id`) ON DELETE RESTRICT
        ;");

        $this->execute("SET FOREIGN_KEY_CHECKS = 1;");
    }

    public function down(): void
    {
        $this->execute("SET FOREIGN_KEY_CHECKS = 0;");

        $this->dropForeignKeyToTable('settings_users', 'settings_users_voc');
        $this->dropForeignKeyToTable('settings_users_voc', 'settings_groups');
        $this->dropForeignKeyToTable('settings_groups', 'settings_groups');

        $this->execute("RENAME TABLE `settings_groups` TO `settings_users_groups`;");

        $this->execute("
            ALTER TABLE `settings_users`
            ADD CONSTRAINT `fk_settings_users_settingid`
            FOREIGN KEY (`settingid`) REFERENCES `settings_users_voc`(`id`) ON DELETE CASCADE
        ;");

        $this->execute("
            ALTER TABLE `settings_users_voc`
            ADD CONSTRAINT `fk_settings_users_voc_groupid`
            FOREIGN KEY (`groupid`) REFERENCES `settings_users_groups`(`id`) ON DELETE RESTRICT
        ;");

        $this->execute("
            ALTER TABLE `settings_users_groups`
            ADD CONSTRAINT `fk_settings_groups_parent`
            FOREIGN KEY (`parent`) REFERENCES `settings_users_groups`(`id`) ON DELETE RESTRICT
        ;");

        $this->execute("ALTER TABLE `settings_users_voc` MODIFY COLUMN `name` VARCHAR(255) NOT NULL;");
        $this->execute("ALTER TABLE `settings_users_groups` MODIFY COLUMN `name` VARCHAR(255) NOT NULL;");

        $this->execute("SET FOREIGN_KEY_CHECKS = 1;");
    }
}
