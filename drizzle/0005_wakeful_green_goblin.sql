CREATE TABLE `mercy_email_subscriptions` (
	`email` text PRIMARY KEY NOT NULL,
	`unsubscribe_token` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`last_event_id` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mercy_email_subscriptions_unsubscribe_token_unique` ON `mercy_email_subscriptions` (`unsubscribe_token`);