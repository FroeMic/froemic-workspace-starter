ALTER TABLE "jokes" ALTER COLUMN "text" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "jokes" ADD COLUMN "status" varchar(32) DEFAULT 'completed' NOT NULL;