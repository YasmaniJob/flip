ALTER TABLE "meetings" ADD COLUMN "created_by_user_id" text;--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_meeting_created_by" ON "meetings" USING btree ("created_by_user_id");