ALTER TABLE "diagnostic_sessions" ADD COLUMN "user_id" text;--> statement-breakpoint
ALTER TABLE "diagnostic_sessions" ADD CONSTRAINT "diagnostic_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_diagnostic_session_user" ON "diagnostic_sessions" USING btree ("user_id");