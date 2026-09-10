<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class ConvertConfirmBeforeToBigint extends AbstractMigration
{
    public function up(): void
    {
        $this->execute("ALTER TABLE users MODIFY COLUMN confirmbefore VARCHAR(255) NULL");
        $this->execute("ALTER TABLE userschange MODIFY COLUMN confirmbefore VARCHAR(255) NULL");

        $this->execute("
            UPDATE users 
            SET confirmbefore = CAST(UNIX_TIMESTAMP(DATE_SUB(STR_TO_DATE(confirmbefore, '%Y-%m-%d %H:%i:%s'), INTERVAL 3 HOUR)) * 1000 AS CHAR)
        ");

        $this->execute("
            UPDATE userschange 
            SET confirmbefore = CAST(UNIX_TIMESTAMP(DATE_SUB(STR_TO_DATE(confirmbefore, '%Y-%m-%d %H:%i:%s'), INTERVAL 3 HOUR)) * 1000 AS CHAR)
        ");

        $this->execute("ALTER TABLE users MODIFY COLUMN confirmbefore BIGINT(20) UNSIGNED NOT NULL DEFAULT 0");
        $this->execute("ALTER TABLE userschange MODIFY COLUMN confirmbefore BIGINT(20) UNSIGNED NOT NULL DEFAULT 0");
    }

    public function down(): void
    {
        $this->execute("ALTER TABLE users MODIFY COLUMN confirmbefore VARCHAR(255) NULL");
        $this->execute("ALTER TABLE userschange MODIFY COLUMN confirmbefore VARCHAR(255) NULL");

        $this->execute("
            UPDATE users 
            SET confirmbefore = DATE_ADD(FROM_UNIXTIME(CAST(confirmbefore AS UNSIGNED) / 1000), INTERVAL 3 HOUR)
        ");

        $this->execute("
            UPDATE userschange 
            SET confirmbefore = DATE_ADD(FROM_UNIXTIME(CAST(confirmbefore AS UNSIGNED) / 1000), INTERVAL 3 HOUR)
        ");

        $this->execute("ALTER TABLE users MODIFY COLUMN confirmbefore DATETIME NULL");
        $this->execute("ALTER TABLE userschange MODIFY COLUMN confirmbefore DATETIME NULL");
    }
}
