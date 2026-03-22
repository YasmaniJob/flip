CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"id_token" text,
	"password" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"name" text NOT NULL,
	"icon" text,
	"color" text
);
--> statement-breakpoint
CREATE TABLE "category_sequences" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"category_prefix" text NOT NULL,
	"last_number" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "classroom_reservations" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"classroom_id" text NOT NULL,
	"staff_id" text NOT NULL,
	"grade_id" text,
	"section_id" text,
	"curricular_area_id" text,
	"type" text DEFAULT 'class',
	"title" text,
	"purpose" text,
	"status" text DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	"cancelled_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "classrooms" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"name" text NOT NULL,
	"code" text,
	"is_primary" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0,
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "curricular_areas" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"name" text NOT NULL,
	"levels" jsonb,
	"is_standard" boolean DEFAULT false,
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "grades" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"name" text NOT NULL,
	"level" text NOT NULL,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "institutions" (
	"id" text PRIMARY KEY NOT NULL,
	"codigo_modular" text,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"nivel" text,
	"plan" text DEFAULT 'free',
	"is_platform_owner" boolean DEFAULT false,
	"subscription_status" text DEFAULT 'trial',
	"trial_ends_at" timestamp,
	"subscription_ends_at" timestamp,
	"settings" jsonb,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "institutions_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "loan_resources" (
	"id" text PRIMARY KEY NOT NULL,
	"loan_id" text NOT NULL,
	"resource_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loans" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"staff_id" text,
	"requested_by_user_id" text,
	"status" text DEFAULT 'active',
	"approval_status" text DEFAULT 'approved',
	"purpose" text,
	"purpose_details" jsonb,
	"loan_date" timestamp DEFAULT now(),
	"return_date" timestamp,
	"damage_reports" jsonb,
	"suggestion_reports" jsonb,
	"missing_resources" jsonb,
	"notes" text,
	"student_pickup_note" text
);
--> statement-breakpoint
CREATE TABLE "meeting_attendance" (
	"id" text PRIMARY KEY NOT NULL,
	"meeting_id" text NOT NULL,
	"staff_id" text NOT NULL,
	"status" text DEFAULT 'presente',
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "meeting_tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"meeting_id" text NOT NULL,
	"description" text NOT NULL,
	"assigned_staff_id" text,
	"status" text DEFAULT 'pending',
	"due_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "meetings" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"title" text NOT NULL,
	"date" timestamp NOT NULL,
	"start_time" text,
	"end_time" text,
	"type" text DEFAULT 'asistencia_tecnica',
	"status" text DEFAULT 'active',
	"involved_actors" jsonb DEFAULT '[]'::jsonb,
	"involved_areas" jsonb DEFAULT '[]'::jsonb,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "pedagogical_hours" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"name" text NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"sort_order" integer DEFAULT 0,
	"is_break" boolean DEFAULT false,
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reservation_attendance" (
	"id" text PRIMARY KEY NOT NULL,
	"reservation_id" text NOT NULL,
	"staff_id" text NOT NULL,
	"status" text DEFAULT 'presente',
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "reservation_slots" (
	"id" text PRIMARY KEY NOT NULL,
	"reservation_id" text NOT NULL,
	"institution_id" text NOT NULL,
	"classroom_id" text NOT NULL,
	"pedagogical_hour_id" text NOT NULL,
	"date" timestamp NOT NULL,
	"attended" boolean DEFAULT false,
	"attended_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "reservation_tasks" (
	"id" text PRIMARY KEY NOT NULL,
	"reservation_id" text NOT NULL,
	"description" text NOT NULL,
	"assigned_staff_id" text,
	"status" text DEFAULT 'pending',
	"due_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "resource_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text,
	"category_id" text,
	"name" text NOT NULL,
	"icon" text,
	"default_brand" text,
	"default_model" text,
	"is_default" boolean DEFAULT false,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "resources" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"category_id" text,
	"template_id" text,
	"internal_id" text,
	"name" text NOT NULL,
	"brand" text,
	"model" text,
	"serial_number" text,
	"status" text DEFAULT 'disponible',
	"condition" text DEFAULT 'bueno',
	"stock" integer DEFAULT 1,
	"attributes" jsonb,
	"notes" text,
	"maintenance_progress" integer DEFAULT 0,
	"maintenance_state" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sections" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"name" text NOT NULL,
	"grade_id" text NOT NULL,
	"area_id" text,
	"student_count" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "staff" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text NOT NULL,
	"name" text NOT NULL,
	"dni" text,
	"email" text,
	"phone" text,
	"area" text,
	"role" text DEFAULT 'docente',
	"status" text DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"institution_id" text,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false,
	"image" text,
	"dni" text,
	"role" text DEFAULT 'docente',
	"is_super_admin" boolean DEFAULT false,
	"settings" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category_sequences" ADD CONSTRAINT "category_sequences_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classroom_reservations" ADD CONSTRAINT "classroom_reservations_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classroom_reservations" ADD CONSTRAINT "classroom_reservations_classroom_id_classrooms_id_fk" FOREIGN KEY ("classroom_id") REFERENCES "public"."classrooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classroom_reservations" ADD CONSTRAINT "classroom_reservations_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classroom_reservations" ADD CONSTRAINT "classroom_reservations_grade_id_grades_id_fk" FOREIGN KEY ("grade_id") REFERENCES "public"."grades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classroom_reservations" ADD CONSTRAINT "classroom_reservations_section_id_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."sections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classroom_reservations" ADD CONSTRAINT "classroom_reservations_curricular_area_id_curricular_areas_id_fk" FOREIGN KEY ("curricular_area_id") REFERENCES "public"."curricular_areas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classrooms" ADD CONSTRAINT "classrooms_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curricular_areas" ADD CONSTRAINT "curricular_areas_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grades" ADD CONSTRAINT "grades_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_resources" ADD CONSTRAINT "loan_resources_loan_id_loans_id_fk" FOREIGN KEY ("loan_id") REFERENCES "public"."loans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loan_resources" ADD CONSTRAINT "loan_resources_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_attendance" ADD CONSTRAINT "meeting_attendance_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_attendance" ADD CONSTRAINT "meeting_attendance_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_tasks" ADD CONSTRAINT "meeting_tasks_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_tasks" ADD CONSTRAINT "meeting_tasks_assigned_staff_id_staff_id_fk" FOREIGN KEY ("assigned_staff_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedagogical_hours" ADD CONSTRAINT "pedagogical_hours_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_attendance" ADD CONSTRAINT "reservation_attendance_reservation_id_classroom_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."classroom_reservations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_attendance" ADD CONSTRAINT "reservation_attendance_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_slots" ADD CONSTRAINT "reservation_slots_reservation_id_classroom_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."classroom_reservations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_slots" ADD CONSTRAINT "reservation_slots_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_slots" ADD CONSTRAINT "reservation_slots_classroom_id_classrooms_id_fk" FOREIGN KEY ("classroom_id") REFERENCES "public"."classrooms"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_slots" ADD CONSTRAINT "reservation_slots_pedagogical_hour_id_pedagogical_hours_id_fk" FOREIGN KEY ("pedagogical_hour_id") REFERENCES "public"."pedagogical_hours"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_tasks" ADD CONSTRAINT "reservation_tasks_reservation_id_classroom_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."classroom_reservations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_tasks" ADD CONSTRAINT "reservation_tasks_assigned_staff_id_staff_id_fk" FOREIGN KEY ("assigned_staff_id") REFERENCES "public"."staff"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_templates" ADD CONSTRAINT "resource_templates_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_templates" ADD CONSTRAINT "resource_templates_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_template_id_resource_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."resource_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sections" ADD CONSTRAINT "sections_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sections" ADD CONSTRAINT "sections_grade_id_grades_id_fk" FOREIGN KEY ("grade_id") REFERENCES "public"."grades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sections" ADD CONSTRAINT "sections_area_id_curricular_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."curricular_areas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff" ADD CONSTRAINT "staff_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_account_user" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_category_institution" ON "categories" USING btree ("institution_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_sequence_institution_prefix" ON "category_sequences" USING btree ("institution_id","category_prefix");--> statement-breakpoint
CREATE INDEX "idx_classroom_res_institution" ON "classroom_reservations" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_classroom_res_classroom" ON "classroom_reservations" USING btree ("classroom_id");--> statement-breakpoint
CREATE INDEX "idx_classroom_res_staff" ON "classroom_reservations" USING btree ("staff_id");--> statement-breakpoint
CREATE INDEX "idx_classroom_institution" ON "classrooms" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_classroom_institution_primary" ON "classrooms" USING btree ("institution_id","is_primary");--> statement-breakpoint
CREATE INDEX "idx_area_institution" ON "curricular_areas" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_grade_institution_level" ON "grades" USING btree ("institution_id","level");--> statement-breakpoint
CREATE INDEX "idx_institution_slug" ON "institutions" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "idx_institution_codigo" ON "institutions" USING btree ("codigo_modular");--> statement-breakpoint
CREATE INDEX "idx_loan_resource_loan" ON "loan_resources" USING btree ("loan_id");--> statement-breakpoint
CREATE INDEX "idx_loan_resource_composite" ON "loan_resources" USING btree ("loan_id","resource_id");--> statement-breakpoint
CREATE INDEX "idx_loan_institution_status" ON "loans" USING btree ("institution_id","status");--> statement-breakpoint
CREATE INDEX "idx_loan_staff" ON "loans" USING btree ("staff_id");--> statement-breakpoint
CREATE INDEX "idx_loan_requested_by" ON "loans" USING btree ("requested_by_user_id");--> statement-breakpoint
CREATE INDEX "idx_attendance_meeting" ON "meeting_attendance" USING btree ("meeting_id");--> statement-breakpoint
CREATE INDEX "idx_attendance_staff" ON "meeting_attendance" USING btree ("staff_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_attendance_unique" ON "meeting_attendance" USING btree ("meeting_id","staff_id");--> statement-breakpoint
CREATE INDEX "idx_task_meeting" ON "meeting_tasks" USING btree ("meeting_id");--> statement-breakpoint
CREATE INDEX "idx_task_staff" ON "meeting_tasks" USING btree ("assigned_staff_id");--> statement-breakpoint
CREATE INDEX "idx_meeting_institution" ON "meetings" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_meeting_date" ON "meetings" USING btree ("date");--> statement-breakpoint
CREATE INDEX "idx_pedagogical_hour_institution" ON "pedagogical_hours" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_res_attendance_reservation" ON "reservation_attendance" USING btree ("reservation_id");--> statement-breakpoint
CREATE INDEX "idx_res_attendance_staff" ON "reservation_attendance" USING btree ("staff_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_res_attendance_unique" ON "reservation_attendance" USING btree ("reservation_id","staff_id");--> statement-breakpoint
CREATE INDEX "idx_slot_reservation" ON "reservation_slots" USING btree ("reservation_id");--> statement-breakpoint
CREATE INDEX "idx_slot_classroom" ON "reservation_slots" USING btree ("classroom_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_slot_unique" ON "reservation_slots" USING btree ("classroom_id","date","pedagogical_hour_id");--> statement-breakpoint
CREATE INDEX "idx_res_task_reservation" ON "reservation_tasks" USING btree ("reservation_id");--> statement-breakpoint
CREATE INDEX "idx_res_task_staff" ON "reservation_tasks" USING btree ("assigned_staff_id");--> statement-breakpoint
CREATE INDEX "idx_template_category" ON "resource_templates" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "idx_template_institution" ON "resource_templates" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_resource_institution_category" ON "resources" USING btree ("institution_id","category_id");--> statement-breakpoint
CREATE INDEX "idx_resource_status" ON "resources" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_resource_internal_id" ON "resources" USING btree ("institution_id","internal_id");--> statement-breakpoint
CREATE INDEX "idx_section_grade" ON "sections" USING btree ("grade_id");--> statement-breakpoint
CREATE INDEX "idx_session_user" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_session_token" ON "sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_staff_institution" ON "staff" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_staff_name" ON "staff" USING btree ("name");--> statement-breakpoint
CREATE INDEX "idx_staff_dni" ON "staff" USING btree ("dni");--> statement-breakpoint
CREATE INDEX "idx_staff_email" ON "staff" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_staff_role" ON "staff" USING btree ("role");--> statement-breakpoint
CREATE INDEX "idx_staff_status" ON "staff" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_user_institution" ON "users" USING btree ("institution_id");--> statement-breakpoint
CREATE INDEX "idx_user_email" ON "users" USING btree ("email");