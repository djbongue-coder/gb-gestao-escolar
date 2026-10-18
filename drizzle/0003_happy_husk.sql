ALTER TABLE `atas` ADD `status` enum('rascunho','aprovada') DEFAULT 'rascunho' NOT NULL;--> statement-breakpoint
ALTER TABLE `atas` ADD `approvedAt` timestamp;--> statement-breakpoint
ALTER TABLE `atas` ADD `approvedBy` varchar(200);--> statement-breakpoint
ALTER TABLE `atas` ADD `approvedByUserId` int;