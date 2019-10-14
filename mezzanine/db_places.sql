CREATE TABLE `users` (
	`id` VARCHAR (32) NOT NULL,
	`login` VARCHAR (100) NOT NULL,
	`password` VARCHAR (255) NOT NULL,
	`name` VARCHAR (100) NOT NULL DEFAULT '',
	`email` VARCHAR (100) NOT NULL,
	`phone` VARCHAR (20) NOT NULL DEFAULT '',
	`confirmed` BOOLEAN NOT NULL DEFAULT 0,
	`confirmbefore` DATETIME NOT NULL,
	`token` VARCHAR (32) NOT NULL,
	`homeplace` VARCHAR (32) DEFAULT NULL,
	PRIMARY KEY (`id`),
	CONSTRAINT `U_users` UNIQUE (`id`, `login`, `email`, `token`)
);
CREATE TABLE `users_change` (
	`id` VARCHAR (32) NOT NULL,
	`login` VARCHAR (100) NOT NULL,
	`password` VARCHAR (255) NOT NULL,
	`name` VARCHAR (100) NOT NULL DEFAULT '',
	`email` VARCHAR (100) NOT NULL,
	`phone` VARCHAR (20) NOT NULL DEFAULT '',
	`confirmed` BOOLEAN NOT NULL DEFAULT 0,
	`confirmbefore` DATETIME NOT NULL,
	`token` VARCHAR (32) NOT NULL,
	`homeplace` VARCHAR (32) NOT NULL DEFAULT '',
	PRIMARY KEY (`id`),
	CONSTRAINT `U_users_change` UNIQUE (`id`, `login`, `email`, `token`)
);
CREATE TABLE `groups` (
	`id` VARCHAR (32) NOT NULL,
	`parent` VARCHAR (32) DEFAULT NULL,
	`name` VARCHAR (500) NOT NULL,
	`description` VARCHAR (2044) NOT NULL DEFAULT '',
	`owner` VARCHAR (32) NOT NULL,
	`system` BOOLEAN NOT NULL DEFAULT 0,
	`haschildren` BOOLEAN NOT NULL DEFAULT 0,
	PRIMARY KEY (`id`),
	CONSTRAINT `U_groups` UNIQUE (`id`)
);
CREATE TABLE `usergroup` (
	`user` VARCHAR (32) NOT NULL,
	`group` VARCHAR (32) NOT NULL,
	`enabled` BOOLEAN NOT NULL DEFAULT 1,
	PRIMARY KEY (`user`, `group`)
);
CREATE TABLE `places` (
	`id` VARCHAR (32) NOT NULL,
	`folderid` VARCHAR (32) NOT NULL DEFAULT 'root',
	`name` VARCHAR (512) NOT NULL DEFAULT 'Без названия',
	`description` VARCHAR (2048) NOT NULL DEFAULT '',
	`link` VARCHAR (512) NOT NULL DEFAULT '',
	`latitude` DOUBLE NOT NULL,
	`longitude` DOUBLE NOT NULL,
	`altitudecapability` DOUBLE DEFAULT NULL,
	`time` VARCHAR (24) NOT NULL DEFAULT '',
	`srt` DOUBLE NOT NULL DEFAULT 0,
	`common` DOUBLE NOT NULL DEFAULT 0,
	`userid` VARCHAR (32) NOT NULL,
	PRIMARY KEY (`id`),
	CONSTRAINT `U_places` UNIQUE (`id`)
);
CREATE TABLE `folders` (
	`id` VARCHAR (32) NOT NULL,
	`parent` VARCHAR (32) DEFAULT NULL,
	`name` VARCHAR (500) NOT NULL DEFAULT 'Без названия',
	`description` VARCHAR (2044) NOT NULL DEFAULT '',
	`srt` DOUBLE NOT NULL DEFAULT '0',
	`userid` VARCHAR (32) NOT NULL,
	PRIMARY KEY (`id`),
	CONSTRAINT `U_folders` UNIQUE (`id`)
);
CREATE TABLE `images` (
	`id` VARCHAR (32) NOT NULL,
	`file` VARCHAR (40) NOT NULL,
	`size` INT UNSIGNED NOT NULL,
	`type` VARCHAR (32) NOT NULL,
	`lastmodified` INT UNSIGNED NOT NULL,
	`srt` DOUBLE NOT NULL DEFAULT 0,
	`placeid` VARCHAR (32) NOT NULL,
	PRIMARY KEY (`id`),
	CONSTRAINT `U_images` UNIQUE (`id`, `file`)
);
ALTER TABLE `usergroup` ADD FOREIGN KEY (`user`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE `usergroup` ADD FOREIGN KEY (`group`) REFERENCES `groups`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE `groups` ADD FOREIGN KEY (`owner`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE `places` ADD FOREIGN KEY (`userid`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE `places` ADD FOREIGN KEY (`folderid`) REFERENCES `folders`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE `images` ADD FOREIGN KEY (`placeid`) REFERENCES `places`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

INSERT INTO `groups`
	(`id`, `parent`, `name`, `description`, `owner`, `system`, `haschildren`)
VALUES
	('admins', 'management', 'Админы', NULL, NULL, 1, 0),
	('beginners', 'visiting', 'Начинающие', NULL, NULL, 1, 0),
	('management', NULL, 'Управление', NULL, NULL, 1, 1),
	('managers', 'management', 'Управляющие', NULL, NULL, 1, 0),
	('ordinary', 'visiting', 'Обыкновенные', NULL, NULL, 1, 0),
	('publishers', 'management', 'Издатели', NULL, NULL, 1, 0),
	('superusers', 'visiting', 'Суперпользователи', NULL, NULL, 1, 0),
	('trusted', 'visiting', 'Доверенные', NULL, NULL, 1, 0),
	('visiting', NULL, 'Посещение', NULL, NULL, 1, 1);
