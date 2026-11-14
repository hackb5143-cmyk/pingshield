CREATE TABLE `recovery_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`tag_code` text NOT NULL,
	`message` text NOT NULL,
	`finder_contact` text,
	`latitude` real,
	`longitude` real,
	`accuracy` real,
	`manual_location` text,
	`requester_hash` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`live_token_hash` text,
	`live_expires_at` text,
	`sharing_stopped_at` text
);
--> statement-breakpoint
CREATE INDEX `recovery_rate` ON `recovery_reports` (`requester_hash`,`created_at`);--> statement-breakpoint
CREATE INDEX `recovery_tag` ON `recovery_reports` (`tag_code`,`created_at`);