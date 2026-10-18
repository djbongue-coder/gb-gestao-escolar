ALTER TABLE `classrooms` MODIFY COLUMN `capacity` int DEFAULT 40;--> statement-breakpoint
ALTER TABLE `evaluations` MODIFY COLUMN `maxValue` double DEFAULT 20;--> statement-breakpoint
ALTER TABLE `students` MODIFY COLUMN `nationality` varchar(50) DEFAULT 'Angolana';--> statement-breakpoint
ALTER TABLE `angola_provinces` DROP COLUMN `area_km2`;--> statement-breakpoint
ALTER TABLE `mini_pautas` DROP COLUMN `mac`;--> statement-breakpoint
ALTER TABLE `mini_pautas` DROP COLUMN `npp`;--> statement-breakpoint
ALTER TABLE `mini_pautas` DROP COLUMN `npt`;--> statement-breakpoint
CREATE TABLE `atas` (
  `id` int AUTO_INCREMENT NOT NULL,
  `classId` int NOT NULL,
  `academicYearId` int NOT NULL,
  `numero` varchar(50),
  `meetingDate` timestamp,
  `location` varchar(255),
  `startTime` varchar(10),
  `endTime` varchar(10),
  `agenda` text,
  `deliberacoes` text,
  `observacoes` text,
  `resumoJson` text,
  `directorName` varchar(200),
  `coordenadorName` varchar(200),
  `conselhoMembrosJson` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  `period` enum('1trimestre','2trimestre','3trimestre','epoca','final') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
