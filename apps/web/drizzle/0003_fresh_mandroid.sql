CREATE TABLE "changelog" (
	"id" text PRIMARY KEY NOT NULL,
	"version" text NOT NULL,
	"title" text NOT NULL,
	"date" timestamp NOT NULL,
	"improvements" jsonb,
	"fixes" jsonb,
	"published" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "changelog_version_unique" UNIQUE("version")
);
--> statement-breakpoint
CREATE TABLE "diagnostic_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"institution_id" text,
	"name" text NOT NULL,
	"description" text,
	"order" integer NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "diagnostic_categories_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "diagnostic_questions" (
	"id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"category_id" text NOT NULL,
	"institution_id" text,
	"text" text NOT NULL,
	"order" integer NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "diagnostic_questions_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "diagnostic_responses" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"question_id" text NOT NULL,
	"score" integer NOT NULL,
	"answered_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "diagnostic_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"institution_id" text NOT NULL,
	"staff_id" text,
	"name" text NOT NULL,
	"dni" text,
	"email" text,
	"ip_address" text,
	"user_agent" text,
	"status" text DEFAULT 'in_progress',
	"progress" integer DEFAULT 0,
	"total_questions" integer DEFAULT 0,
	"overall_score" integer,
	"level" text,
	"category_scores" jsonb,
	"expires_at" timestamp NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "diagnostic_sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "institutions" ADD COLUMN "diagnostic_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "institutions" ADD COLUMN "diagnostic_requires_approval" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "institutions" ADD COLUMN "diagnostic_custom_message" text;--> statement-breakpoint
ALTER TABLE "diagnostic_categories" ADD CONSTRAINT "diagnostic_categories_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnostic_questions" ADD CONSTRAINT "diagnostic_questions_category_id_diagnostic_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."diagnostic_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnostic_questions" ADD CONSTRAINT "diagnostic_questions_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnostic_responses" ADD CONSTRAINT "diagnostic_responses_session_id_diagnostic_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."diagnostic_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnostic_responses" ADD CONSTRAINT "diagnostic_responses_question_id_diagnostic_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."diagnostic_questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnostic_sessions" ADD CONSTRAINT "diagnostic_sessions_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnostic_sessions" ADD CONSTRAINT "diagnostic_sessions_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_changelog_version" ON "changelog" USING btree ("version");--> statement-breakpoint
CREATE INDEX "idx_changelog_published" ON "changelog" USING btree ("published");--> statement-breakpoint
CREATE INDEX "idx_changelog_sort" ON "changelog" USING btree ("sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_diagnostic_category_code" ON "diagnostic_categories" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_diagnostic_category_institution" ON "diagnostic_categories" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_diagnostic_category_order" ON "diagnostic_categories" USING btree ("order");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_diagnostic_question_code" ON "diagnostic_questions" USING btree ("code");--> statement-breakpoint
CREATE INDEX "idx_diagnostic_question_category" ON "diagnostic_questions" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_diagnostic_question_institution" ON "diagnostic_questions" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_diagnostic_question_order" ON "diagnostic_questions" USING btree ("order");--> statement-breakpoint
CREATE INDEX "idx_diagnostic_response_session" ON "diagnostic_responses" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_diagnostic_response_question" ON "diagnostic_responses" USING btree ("question_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_diagnostic_response_session_question" ON "diagnostic_responses" USING btree ("session_id","question_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_diagnostic_session_token" ON "diagnostic_sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_diagnostic_session_institution" ON "diagnostic_sessions" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_diagnostic_session_staff" ON "diagnostic_sessions" USING btree ("staff_id");--> statement-breakpoint
CREATE INDEX "idx_diagnostic_session_status" ON "diagnostic_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_diagnostic_session_dni" ON "diagnostic_sessions" USING btree ("dni");--> statement-breakpoint
CREATE INDEX "idx_diagnostic_session_email" ON "diagnostic_sessions" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_grade_institution" ON "grades" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_slot_institution" ON "reservation_slots" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_slot_institution_date" ON "reservation_slots" USING btree ("institution_id","date");--> statement-breakpoint
CREATE INDEX "idx_section_institution" ON "sections" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_staff_dni_global" ON "staff" USING btree ("dni");--> statement-breakpoint
CREATE INDEX "idx_staff_email_global" ON "staff" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_staff_phone" ON "staff" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "idx_staff_area" ON "staff" USING btree ("area");--> statement-breakpoint
CREATE INDEX "idx_user_dni" ON "users" USING btree ("dni");--> statement-breakpoint
CREATE INDEX "idx_user_role" ON "users" USING btree ("role");