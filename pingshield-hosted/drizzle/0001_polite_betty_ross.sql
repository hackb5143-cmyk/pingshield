CREATE TABLE `contact_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`thread_id` text NOT NULL,
	`sender` text NOT NULL,
	`content` text NOT NULL,
	`created_at` text NOT NULL,
	`sequence` integer NOT NULL,
	FOREIGN KEY (`thread_id`) REFERENCES `contact_threads`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `contact_messages_thread` ON `contact_messages` (`thread_id`,`sequence`);--> statement-breakpoint
CREATE TABLE `contact_threads` (
	`id` text PRIMARY KEY NOT NULL,
	`tag_code` text NOT NULL,
	`token_hash` text NOT NULL,
	`requester_hash` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`expires_at` text NOT NULL,
	`callback_ciphertext` text,
	`callback_hint` text,
	`call_status` text DEFAULT 'not_requested' NOT NULL,
	`call_sid` text
);
--> statement-breakpoint
CREATE INDEX `contact_rate` ON `contact_threads` (`requester_hash`,`created_at`);--> statement-breakpoint
CREATE INDEX `contact_time` ON `contact_threads` (`updated_at`);