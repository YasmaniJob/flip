ALTER TABLE "accounts" DROP CONSTRAINT "accounts_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "classroom_reservations" DROP CONSTRAINT "classroom_reservations_staff_id_staff_id_fk";
--> statement-breakpoint
ALTER TABLE "diagnostic_responses" DROP CONSTRAINT "diagnostic_responses_session_id_diagnostic_sessions_id_fk";
--> statement-breakpoint
ALTER TABLE "diagnostic_sessions" DROP CONSTRAINT "diagnostic_sessions_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "diagnostic_sessions" DROP CONSTRAINT "diagnostic_sessions_staff_id_staff_id_fk";
--> statement-breakpoint
ALTER TABLE "incidents" DROP CONSTRAINT "incidents_assignee_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "loans" DROP CONSTRAINT "loans_staff_id_staff_id_fk";
--> statement-breakpoint
ALTER TABLE "meeting_attendance" DROP CONSTRAINT "meeting_attendance_meeting_id_meetings_id_fk";
--> statement-breakpoint
ALTER TABLE "meeting_attendance" DROP CONSTRAINT "meeting_attendance_staff_id_staff_id_fk";
--> statement-breakpoint
ALTER TABLE "meeting_tasks" DROP CONSTRAINT "meeting_tasks_meeting_id_meetings_id_fk";
--> statement-breakpoint
ALTER TABLE "meeting_tasks" DROP CONSTRAINT "meeting_tasks_assigned_staff_id_staff_id_fk";
--> statement-breakpoint
ALTER TABLE "meetings" DROP CONSTRAINT "meetings_created_by_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "reservation_attendance" DROP CONSTRAINT "reservation_attendance_reservation_id_classroom_reservations_id_fk";
--> statement-breakpoint
ALTER TABLE "reservation_attendance" DROP CONSTRAINT "reservation_attendance_staff_id_staff_id_fk";
--> statement-breakpoint
ALTER TABLE "reservation_slots" DROP CONSTRAINT "reservation_slots_reservation_id_classroom_reservations_id_fk";
--> statement-breakpoint
ALTER TABLE "reservation_tasks" DROP CONSTRAINT "reservation_tasks_reservation_id_classroom_reservations_id_fk";
--> statement-breakpoint
ALTER TABLE "reservation_tasks" DROP CONSTRAINT "reservation_tasks_assigned_staff_id_staff_id_fk";
--> statement-breakpoint
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "classroom_reservations" ADD CONSTRAINT "classroom_reservations_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnostic_responses" ADD CONSTRAINT "diagnostic_responses_session_id_diagnostic_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."diagnostic_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnostic_sessions" ADD CONSTRAINT "diagnostic_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnostic_sessions" ADD CONSTRAINT "diagnostic_sessions_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_assignee_id_users_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loans" ADD CONSTRAINT "loans_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_attendance" ADD CONSTRAINT "meeting_attendance_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_attendance" ADD CONSTRAINT "meeting_attendance_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_tasks" ADD CONSTRAINT "meeting_tasks_meeting_id_meetings_id_fk" FOREIGN KEY ("meeting_id") REFERENCES "public"."meetings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meeting_tasks" ADD CONSTRAINT "meeting_tasks_assigned_staff_id_staff_id_fk" FOREIGN KEY ("assigned_staff_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "meetings" ADD CONSTRAINT "meetings_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_attendance" ADD CONSTRAINT "reservation_attendance_reservation_id_classroom_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."classroom_reservations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_attendance" ADD CONSTRAINT "reservation_attendance_staff_id_staff_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_slots" ADD CONSTRAINT "reservation_slots_reservation_id_classroom_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."classroom_reservations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_tasks" ADD CONSTRAINT "reservation_tasks_reservation_id_classroom_reservations_id_fk" FOREIGN KEY ("reservation_id") REFERENCES "public"."classroom_reservations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_tasks" ADD CONSTRAINT "reservation_tasks_assigned_staff_id_staff_id_fk" FOREIGN KEY ("assigned_staff_id") REFERENCES "public"."staff"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;