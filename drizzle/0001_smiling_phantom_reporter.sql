CREATE TABLE `angola_municipalities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`provinceId` int NOT NULL,
	CONSTRAINT `angola_municipalities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `angola_provinces` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`capital` varchar(100) NOT NULL,
	`area_km2` int,
	`numMunicipalities` int,
	CONSTRAINT `angola_provinces_id` PRIMARY KEY(`id`),
	CONSTRAINT `angola_provinces_name_unique` UNIQUE(`name`)
);
--> statement-breakpoint
CREATE TABLE `education_levels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(10) NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`gradeRange` varchar(50),
	`active` int DEFAULT 1,
	CONSTRAINT `education_levels_id` PRIMARY KEY(`id`),
	CONSTRAINT `education_levels_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `mini_pautas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`subjectId` int NOT NULL,
	`classId` int NOT NULL,
	`academicYearId` int NOT NULL,
	`mac` double,
	`npp` double,
	`npt` double,
	`mt1` double,
	`mfd` double,
	`exame` double,
	`mfdFinal` double,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mini_pautas_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `pautas_gerais` (
	`id` int AUTO_INCREMENT NOT NULL,
	`studentId` int NOT NULL,
	`subjectId` int NOT NULL,
	`classId` int NOT NULL,
	`academicYearId` int NOT NULL,
	`mdf` double,
	`mf` double,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pautas_gerais_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `classes` ADD `educationLevel` varchar(10);--> statement-breakpoint
ALTER TABLE `courses` ADD `educationLevel` varchar(10);--> statement-breakpoint
ALTER TABLE `schools` ADD `provinceId` int;--> statement-breakpoint
ALTER TABLE `schools` ADD `municipalityId` int;--> statement-breakpoint
ALTER TABLE `subjects` ADD `educationLevel` varchar(10);