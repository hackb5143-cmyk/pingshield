ALTER TABLE `contact_messages` ADD `email_status` text DEFAULT 'not_requested' NOT NULL;--> statement-breakpoint
ALTER TABLE `contact_messages` ADD `email_attempted_at` text;