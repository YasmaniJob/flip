CREATE TABLE "global_config" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"updated_by" text,
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "global_config_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "incident_attachments" (
	"id" text PRIMARY KEY NOT NULL,
	"incident_id" text NOT NULL,
	"uploaded_by" text NOT NULL,
	"file_name" text NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" text NOT NULL,
	"storage_key" text NOT NULL,
	"storage_url" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "incident_change_history" (
	"id" text PRIMARY KEY NOT NULL,
	"incident_id" text NOT NULL,
	"changed_by" text NOT NULL,
	"field" text NOT NULL,
	"old_value" text,
	"new_value" text,
	"change_type" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "incident_comments" (
	"id" text PRIMARY KEY NOT NULL,
	"incident_id" text NOT NULL,
	"author_id" text NOT NULL,
	"content" text NOT NULL,
	"is_resolution_comment" boolean DEFAULT false,
	"is_edited" boolean DEFAULT false,
	"edited_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "incident_sequences" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"last_number" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "incident_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"name" text NOT NULL,
	"type" text NOT NULL,
	"suggested_priority" text NOT NULL,
	"title_template" text NOT NULL,
	"description_template" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "incidents" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"sequential_id" integer NOT NULL,
	"display_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"type" text NOT NULL,
	"priority" text NOT NULL,
	"status" text NOT NULL,
	"reporter_id" text NOT NULL,
	"assignee_id" text,
	"resource_id" text,
	"location" text,
	"master_incident_id" text,
	"is_recurrent" boolean DEFAULT false,
	"recurrence_count" integer DEFAULT 0,
	"resolved_at" timestamp,
	"resolution_time" integer,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "diagnostic_sessions" ADD COLUMN "year" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "institutions" ADD COLUMN "diagnostic_active_year" integer;--> statement-breakpoint
ALTER TABLE "reservation_slots" ADD COLUMN "not_attended" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "reservation_slots" ADD COLUMN "not_attended_at" timestamp;--> statement-breakpoint
ALTER TABLE "incident_attachments" ADD CONSTRAINT "incident_attachments_incident_id_incidents_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."incidents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident_attachments" ADD CONSTRAINT "incident_attachments_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident_change_history" ADD CONSTRAINT "incident_change_history_incident_id_incidents_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."incidents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident_change_history" ADD CONSTRAINT "incident_change_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident_comments" ADD CONSTRAINT "incident_comments_incident_id_incidents_id_fk" FOREIGN KEY ("incident_id") REFERENCES "public"."incidents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident_comments" ADD CONSTRAINT "incident_comments_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident_sequences" ADD CONSTRAINT "incident_sequences_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident_templates" ADD CONSTRAINT "incident_templates_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incident_templates" ADD CONSTRAINT "incident_templates_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_assignee_id_users_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_master_incident_id_incidents_id_fk" FOREIGN KEY ("master_incident_id") REFERENCES "public"."incidents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_global_config_key" ON "global_config" USING btree ("key");--> statement-breakpoint
CREATE INDEX "idx_incident_attachment_incident" ON "incident_attachments" USING btree ("incident_id");--> statement-breakpoint
CREATE INDEX "idx_incident_attachment_uploaded_by" ON "incident_attachments" USING btree ("uploaded_by");--> statement-breakpoint
CREATE INDEX "idx_incident_history_incident_created" ON "incident_change_history" USING btree ("incident_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_incident_history_changed_by" ON "incident_change_history" USING btree ("changed_by");--> statement-breakpoint
CREATE INDEX "idx_incident_comment_incident_created" ON "incident_comments" USING btree ("incident_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_incident_comment_author" ON "incident_comments" USING btree ("author_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_incident_sequence_institution" ON "incident_sequences" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_incident_template_institution_active" ON "incident_templates" USING btree ("institution_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_incident_template_institution_type" ON "incident_templates" USING btree ("institution_id","type");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_incident_institution_sequential" ON "incidents" USING btree ("institution_id","sequential_id");--> statement-breakpoint
CREATE INDEX "idx_incident_institution_status" ON "incidents" USING btree ("institution_id","status");--> statement-breakpoint
CREATE INDEX "idx_incident_institution_priority" ON "incidents" USING btree ("institution_id","priority");--> statement-breakpoint
CREATE INDEX "idx_incident_institution_type" ON "incidents" USING btree ("institution_id","type");--> statement-breakpoint
CREATE INDEX "idx_incident_institution_reporter" ON "incidents" USING btree ("institution_id","reporter_id");--> statement-breakpoint
CREATE INDEX "idx_incident_institution_assignee" ON "incidents" USING btree ("institution_id","assignee_id");--> statement-breakpoint
CREATE INDEX "idx_incident_institution_resource" ON "incidents" USING btree ("institution_id","resource_id");--> statement-breakpoint
CREATE INDEX "idx_incident_institution_created" ON "incidents" USING btree ("institution_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_incident_institution_recurrent" ON "incidents" USING btree ("institution_id","is_recurrent");--> statement-breakpoint
CREATE INDEX "idx_incident_master" ON "incidents" USING btree ("master_incident_id");--> statement-breakpoint
CREATE INDEX "idx_diagnostic_session_year" ON "diagnostic_sessions" USING btree ("year");--> statement-breakpoint
CREATE INDEX "idx_diagnostic_session_institution_year" ON "diagnostic_sessions" USING btree ("institution_id","year");--> statement-breakpoint
CREATE INDEX "idx_diagnostic_session_staff_year" ON "diagnostic_sessions" USING btree ("staff_id","year");--> statement-breakpoint
ALTER TABLE "diagnostic_sessions" ADD CONSTRAINT "unique_institution_staff_year" UNIQUE("institution_id","staff_id","year");--> statement-breakpoint
ALTER TABLE "diagnostic_sessions" ADD CONSTRAINT "unique_institution_user_year" UNIQUE("institution_id","user_id","year");