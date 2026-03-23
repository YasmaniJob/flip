import { pgTable, text, integer, timestamp, boolean, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Updated: 2026-03-22 00:50 - Added missing relations
// ============================================
// EDUCATION INSTITUTIONS (MINEDU Registry)
// ============================================
// NOTA: Esta tabla NO se migra a Neon - irá a Turso después
// export const educationInstitutionsMinedu = pgTable('education_institutions_minedu', {
//     codigoModular: text('codigo_modular').primaryKey(),
//     nombre: text('nombre').notNull(),
//     nivel: text('nivel').notNull(), // 'Primaria' | 'Secundaria'
//     tipoGestion: text('tipo_gestion'), // 'Pública' | 'Privada'
//     departamento: text('departamento'),
//     provincia: text('provincia'),
//     distrito: text('distrito'),
//     direccion: text('direccion'),
//     estado: text('estado').default('Activo'),
// }, (table) => ({
//     nivelIdx: index('idx_ie_minedu_nivel').on(table.nivel),
//     departamentoIdx: index('idx_ie_minedu_departamento').on(table.departamento),
//     nombreIdx: index('idx_ie_minedu_nombre').on(table.nombre),
// }));

// ============================================
// INSTITUTIONS (Multi-tenant - formerly organizations)
// ============================================
export const institutions = pgTable('institutions', {
    id: text('id').primaryKey(),
    codigoModular: text('codigo_modular'), // Reference to MINEDU registry
    name: text('name').notNull(),
    slug: text('slug').unique().notNull(),
    nivel: text('nivel'), // 'primaria' | 'secundaria' | 'ambos'
    plan: text('plan').default('free'),
    isPlatformOwner: boolean('is_platform_owner').default(false),
    subscriptionStatus: text('subscription_status').default('trial'),
    subscriptionPlan: text('subscription_plan').default('trial'), // 'trial' | 'mensual' | 'bimestral' | 'trimestral' | 'anual'
    subscriptionStartDate: timestamp('subscription_start_date'),
    trialEndsAt: timestamp('trial_ends_at'),
    subscriptionEndsAt: timestamp('subscription_ends_at'),
    settings: jsonb('settings'),
    createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
    slugIdx: index('idx_institution_slug').on(table.slug),
    codigoModularIdx: index('idx_institution_codigo').on(table.codigoModular),
}));

// ============================================
// SUBSCRIPTION HISTORY
// ============================================
export const subscriptionHistory = pgTable('subscription_history', {
    id: text('id').primaryKey(),
    institutionId: text('institution_id').references(() => institutions.id).notNull(),
    event: text('event').notNull(), // 'trial_started', 'trial_extended', 'activated', 'deactivated', 'plan_changed', 'reverted_to_trial'
    details: text('details'),
    plan: text('plan'),
    date: timestamp('date').defaultNow().notNull(),
}, (table) => ({
    institutionIdx: index('idx_sub_history_institution').on(table.institutionId),
}));

// ============================================
// USERS (Extended for Better Auth)
// ============================================
export const users = pgTable('users', {
    id: text('id').primaryKey(),
    institutionId: text('institution_id').references(() => institutions.id),
    name: text('name').notNull(),
    email: text('email').unique().notNull(),
    emailVerified: boolean('email_verified').default(false),
    image: text('image'),
    dni: text('dni'),
    role: text('role').default('docente'),
    isSuperAdmin: boolean('is_super_admin').default(false),
    settings: jsonb('settings'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
    institutionIdx: index('idx_user_institution').on(table.institutionId),
    emailIdx: index('idx_user_email').on(table.email),
}));

// ============================================
// SESSIONS (Better Auth)
// ============================================
export const sessions = pgTable('sessions', {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id).notNull(),
    token: text('token').unique().notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
    userIdx: index('idx_session_user').on(table.userId),
    tokenIdx: index('idx_session_token').on(table.token),
}));

// ============================================
// ACCOUNTS (Better Auth - OAuth providers)
// ============================================
export const accounts = pgTable('accounts', {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id).notNull(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    idToken: text('id_token'),
    password: text('password'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
    userIdx: index('idx_account_user').on(table.userId),
}));

// ============================================
// VERIFICATION (Better Auth - email verification, password reset)
// ============================================
export const verification = pgTable('verification', {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// CATEGORIES
// ============================================
export const categories = pgTable('categories', {
    id: text('id').primaryKey(),
    institutionId: text('institution_id').references(() => institutions.id).notNull(),
    name: text('name').notNull(),
    icon: text('icon'),
    color: text('color'),
}, (table) => ({
    institutionIdx: index('idx_category_institution').on(table.institutionId),
}));

// ============================================
// CATEGORY SEQUENCES (Atomic ID generation)
// ============================================
export const categorySequences = pgTable('category_sequences', {
    id: text('id').primaryKey(),
    institutionId: text('institution_id').references(() => institutions.id).notNull(),
    categoryPrefix: text('category_prefix').notNull(),
    lastNumber: integer('last_number').default(0).notNull(),
}, (table) => ({
    uniqueInstitutionPrefix: uniqueIndex('idx_sequence_institution_prefix').on(table.institutionId, table.categoryPrefix),
}));

// ============================================
// RESOURCE TEMPLATES
// ============================================
export const resourceTemplates = pgTable('resource_templates', {
    id: text('id').primaryKey(),
    institutionId: text('institution_id').references(() => institutions.id),
    categoryId: text('category_id').references(() => categories.id),
    name: text('name').notNull(),
    icon: text('icon'),
    defaultBrand: text('default_brand'),
    defaultModel: text('default_model'),
    isDefault: boolean('is_default').default(false),
    sortOrder: integer('sort_order').default(0),
    createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
    categoryIdx: index('idx_template_category').on(table.categoryId),
    institutionIdx: index('idx_template_institution').on(table.institutionId),
}));

// ============================================
// RESOURCES
// ============================================
export const resources = pgTable('resources', {
    id: text('id').primaryKey(),
    institutionId: text('institution_id').references(() => institutions.id).notNull(),
    categoryId: text('category_id').references(() => categories.id),
    templateId: text('template_id').references(() => resourceTemplates.id),
    internalId: text('internal_id'),
    name: text('name').notNull(),
    brand: text('brand'),
    model: text('model'),
    serialNumber: text('serial_number'),
    status: text('status').default('disponible'),
    condition: text('condition').default('bueno'),
    stock: integer('stock').default(1),
    attributes: jsonb('attributes'),
    notes: text('notes'),
    maintenanceProgress: integer('maintenance_progress').default(0),
    maintenanceState: jsonb('maintenance_state'),
    createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
    institutionCategoryIdx: index('idx_resource_institution_category').on(table.institutionId, table.categoryId),
    statusIdx: index('idx_resource_status').on(table.status),
    internalIdIdx: index('idx_resource_internal_id').on(table.institutionId, table.internalId),
}));

// ============================================
// STAFF
// ============================================
export const staff = pgTable('staff', {
    id: text('id').primaryKey(),
    institutionId: text('institution_id').references(() => institutions.id).notNull(),
    name: text('name').notNull(),
    dni: text('dni'),
    email: text('email'),
    phone: text('phone'),
    area: text('area'),
    role: text('role').default('docente'),
    status: text('status').default('active'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
    institutionIdx: index('idx_staff_institution').on(table.institutionId),
    nameIdx: index('idx_staff_name').on(table.name),
    dniIdx: index('idx_staff_dni').on(table.dni),
    emailIdx: index('idx_staff_email').on(table.email),
    roleIdx: index('idx_staff_role').on(table.role),
    statusIdx: index('idx_staff_status').on(table.status),
}));

// ============================================
// LOANS
// ============================================
export const loans = pgTable('loans', {
    id: text('id').primaryKey(),
    institutionId: text('institution_id').references(() => institutions.id).notNull(),
    staffId: text('staff_id').references(() => staff.id),
    requestedByUserId: text('requested_by_user_id'),
    status: text('status').default('active'),
    approvalStatus: text('approval_status').default('approved'), // 'pending' | 'approved' | 'rejected'
    purpose: text('purpose'),
    purposeDetails: jsonb('purpose_details'),
    loanDate: timestamp('loan_date').defaultNow(),
    returnDate: timestamp('return_date'),
    damageReports: jsonb('damage_reports'),
    suggestionReports: jsonb('suggestion_reports'),
    missingResources: jsonb('missing_resources'),
    notes: text('notes'),
    studentPickupNote: text('student_pickup_note'), // Nombre/datos del alumno que recoge en nombre del docente
}, (table) => ({
    institutionStatusIdx: index('idx_loan_institution_status').on(table.institutionId, table.status),
    staffIdx: index('idx_loan_staff').on(table.staffId),
    requestedByIdx: index('idx_loan_requested_by').on(table.requestedByUserId),
}));

// ============================================
// LOAN_RESOURCES (Many-to-Many)
// ============================================
export const loanResources = pgTable('loan_resources', {
    id: text('id').primaryKey(),
    loanId: text('loan_id').references(() => loans.id).notNull(),
    resourceId: text('resource_id').references(() => resources.id).notNull(),
}, (table) => ({
    loanIdx: index('idx_loan_resource_loan').on(table.loanId),
    loanResourceIdx: index('idx_loan_resource_composite').on(table.loanId, table.resourceId),
}));

// ============================================
// CURRICULAR AREAS
// ============================================
export const curricularAreas = pgTable('curricular_areas', {
    id: text('id').primaryKey(),
    institutionId: text('institution_id').references(() => institutions.id).notNull(),
    name: text('name').notNull(),
    levels: jsonb('levels'),
    isStandard: boolean('is_standard').default(false),
    active: boolean('active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
    institutionIdx: index('idx_area_institution').on(table.institutionId),
}));

// ============================================
// GRADES
// ============================================
export const grades = pgTable('grades', {
    id: text('id').primaryKey(),
    institutionId: text('institution_id').references(() => institutions.id).notNull(),
    name: text('name').notNull(),
    level: text('level').notNull(),
    sortOrder: integer('sort_order').default(0),
    createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
    institutionLevelIdx: index('idx_grade_institution_level').on(table.institutionId, table.level),
}));

// ============================================
// SECTIONS
// ============================================
export const sections = pgTable('sections', {
    id: text('id').primaryKey(),
    institutionId: text('institution_id').references(() => institutions.id).notNull(),
    name: text('name').notNull(),
    gradeId: text('grade_id').references(() => grades.id).notNull(),
    areaId: text('area_id').references(() => curricularAreas.id),
    studentCount: integer('student_count'),
    createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
    gradeIdx: index('idx_section_grade').on(table.gradeId),
}));

// ============================================
// PEDAGOGICAL HOURS
// ============================================
export const pedagogicalHours = pgTable('pedagogical_hours', {
    id: text('id').primaryKey(),
    institutionId: text('institution_id').references(() => institutions.id).notNull(),
    name: text('name').notNull(),
    startTime: text('start_time').notNull(),
    endTime: text('end_time').notNull(),
    sortOrder: integer('sort_order').default(0),
    isBreak: boolean('is_break').default(false),
    active: boolean('active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
    institutionIdx: index('idx_pedagogical_hour_institution').on(table.institutionId),
}));

// ============================================
// CLASSROOMS (Physical spaces - AIP, Labs, etc.)
// ============================================
export const classrooms = pgTable('classrooms', {
    id: text('id').primaryKey(),
    institutionId: text('institution_id').references(() => institutions.id).notNull(),
    name: text('name').notNull(),
    code: text('code'),
    isPrimary: boolean('is_primary').default(false),
    sortOrder: integer('sort_order').default(0),
    active: boolean('active').default(true),
    createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
    institutionIdx: index('idx_classroom_institution').on(table.institutionId),
    institutionPrimaryIdx: index('idx_classroom_institution_primary').on(table.institutionId, table.isPrimary),
}));

// ============================================
// CLASSROOM RESERVATIONS
// ============================================
export const classroomReservations = pgTable('classroom_reservations', {
    id: text('id').primaryKey(),
    institutionId: text('institution_id').references(() => institutions.id).notNull(),
    classroomId: text('classroom_id').references(() => classrooms.id).notNull(),
    staffId: text('staff_id').references(() => staff.id).notNull(),
    gradeId: text('grade_id').references(() => grades.id),
    sectionId: text('section_id').references(() => sections.id),
    curricularAreaId: text('curricular_area_id').references(() => curricularAreas.id),
    type: text('type').default('class'),
    title: text('title'), // Used for workshops
    purpose: text('purpose'),
    status: text('status').default('active'), // active, cancelled
    createdAt: timestamp('created_at').defaultNow(),
    cancelledAt: timestamp('cancelled_at'),
}, (table) => ({
    institutionIdx: index('idx_classroom_res_institution').on(table.institutionId),
    classroomIdx: index('idx_classroom_res_classroom').on(table.classroomId),
    staffIdx: index('idx_classroom_res_staff').on(table.staffId),
}));

// ============================================
// RESERVATION SLOTS (date + pedagogical hour)
// ============================================
export const reservationSlots = pgTable('reservation_slots', {
    id: text('id').primaryKey(),
    reservationId: text('reservation_id').references(() => classroomReservations.id).notNull(),
    institutionId: text('institution_id').references(() => institutions.id).notNull(),
    classroomId: text('classroom_id').references(() => classrooms.id).notNull(),
    pedagogicalHourId: text('pedagogical_hour_id').references(() => pedagogicalHours.id).notNull(),
    date: timestamp('date').notNull(),
    attended: boolean('attended').default(false),
    attendedAt: timestamp('attended_at'),
}, (table) => ({
    reservationIdx: index('idx_slot_reservation').on(table.reservationId),
    classroomIdx: index('idx_slot_classroom').on(table.classroomId),
    // Unique constraint: only one reservation per classroom + date + hour
    uniqueSlot: uniqueIndex('idx_slot_unique').on(table.classroomId, table.date, table.pedagogicalHourId),
}));

// ============================================
// MEETINGS
// ============================================
export const meetings = pgTable('meetings', {
    id: text('id').primaryKey(),
    institutionId: text('institution_id').references(() => institutions.id).notNull(),
    title: text('title').notNull(),
    date: timestamp('date').notNull(),
    startTime: text('start_time'),
    endTime: text('end_time'),
    type: text('type').default('asistencia_tecnica'),
    status: text('status').default('active'), // active, cancelled, completed
    involvedActors: jsonb('involved_actors').default([]), // ['Director(a)', 'Docentes', ...]
    involvedAreas: jsonb('involved_areas').default([]), // ['Matemática', 'Comunicación', ...]
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
    institutionIdx: index('idx_meeting_institution').on(table.institutionId),
    dateIdx: index('idx_meeting_date').on(table.date),
}));

// ============================================
// MEETING ATTENDANCE
// ============================================
export const meetingAttendance = pgTable('meeting_attendance', {
    id: text('id').primaryKey(),
    meetingId: text('meeting_id').references(() => meetings.id).notNull(),
    staffId: text('staff_id').references(() => staff.id).notNull(),
    status: text('status').default('presente'), // presente, ausente, tardanza
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
    meetingIdx: index('idx_attendance_meeting').on(table.meetingId),
    staffIdx: index('idx_attendance_staff').on(table.staffId),
    uniqueAttendance: uniqueIndex('idx_attendance_unique').on(table.meetingId, table.staffId),
}));

// ============================================
// MEETING TASKS (Agreements)
// ============================================
export const meetingTasks = pgTable('meeting_tasks', {
    id: text('id').primaryKey(),
    meetingId: text('meeting_id').references(() => meetings.id).notNull(),
    description: text('description').notNull(),
    assignedStaffId: text('assigned_staff_id').references(() => staff.id),
    status: text('status').default('pending'), // pending, completed
    dueDate: timestamp('due_date'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
    meetingIdx: index('idx_task_meeting').on(table.meetingId),
    assignedStaffIdx: index('idx_task_staff').on(table.assignedStaffId),
}));

// ============================================
// RESERVATION ATTENDANCE (per-person for workshops)
// ============================================
export const reservationAttendance = pgTable('reservation_attendance', {
    id: text('id').primaryKey(),
    reservationId: text('reservation_id').references(() => classroomReservations.id).notNull(),
    staffId: text('staff_id').references(() => staff.id).notNull(),
    status: text('status').default('presente'), // presente, ausente, tardanza
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
    reservationIdx: index('idx_res_attendance_reservation').on(table.reservationId),
    staffIdx: index('idx_res_attendance_staff').on(table.staffId),
    uniqueAttendance: uniqueIndex('idx_res_attendance_unique').on(table.reservationId, table.staffId),
}));

// ============================================
// RESERVATION TASKS (Agreements for workshops)
// ============================================
export const reservationTasks = pgTable('reservation_tasks', {
    id: text('id').primaryKey(),
    reservationId: text('reservation_id').references(() => classroomReservations.id).notNull(),
    description: text('description').notNull(),
    assignedStaffId: text('assigned_staff_id').references(() => staff.id),
    status: text('status').default('pending'), // pending, completed
    dueDate: timestamp('due_date'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
    reservationIdx: index('idx_res_task_reservation').on(table.reservationId),
    assignedStaffIdx: index('idx_res_task_staff').on(table.assignedStaffId),
}));

// ============================================
// RELATIONS
// ============================================
export const institutionsRelations = relations(institutions, ({ many }) => ({
    users: many(users),
    categories: many(categories),
    resources: many(resources),
    staff: many(staff),
    loans: many(loans),
    meetings: many(meetings),
    subscriptionHistory: many(subscriptionHistory),
}));

export const subscriptionHistoryRelations = relations(subscriptionHistory, ({ one }) => ({
    institution: one(institutions, {
        fields: [subscriptionHistory.institutionId],
        references: [institutions.id],
    }),
}));

export const usersRelations = relations(users, ({ one }) => ({
    institution: one(institutions, {
        fields: [users.institutionId],
        references: [institutions.id],
    }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
    institution: one(institutions, {
        fields: [categories.institutionId],
        references: [institutions.id],
    }),
    resources: many(resources),
}));

export const staffRelations = relations(staff, ({ one, many }) => ({
    institution: one(institutions, {
        fields: [staff.institutionId],
        references: [institutions.id],
    }),
    loans: many(loans),
    meetingAttendance: many(meetingAttendance),
    assignedTasks: many(meetingTasks),
}));

export const curricularAreasRelations = relations(curricularAreas, ({ one, many }) => ({
    institution: one(institutions, {
        fields: [curricularAreas.institutionId],
        references: [institutions.id],
    }),
    reservations: many(classroomReservations),
}));

export const gradesRelations = relations(grades, ({ one, many }) => ({
    institution: one(institutions, {
        fields: [grades.institutionId],
        references: [institutions.id],
    }),
    reservations: many(classroomReservations),
}));

export const sectionsRelations = relations(sections, ({ one, many }) => ({
    institution: one(institutions, {
        fields: [sections.institutionId],
        references: [institutions.id],
    }),
    grade: one(grades, {
        fields: [sections.gradeId],
        references: [grades.id],
    }),
    reservations: many(classroomReservations),
}));

export const loansRelations = relations(loans, ({ one, many }) => ({
    institution: one(institutions, {
        fields: [loans.institutionId],
        references: [institutions.id],
    }),
    staff: one(staff, {
        fields: [loans.staffId],
        references: [staff.id],
    }),
    loanResources: many(loanResources),
}));

export const loanResourcesRelations = relations(loanResources, ({ one }) => ({
    loan: one(loans, {
        fields: [loanResources.loanId],
        references: [loans.id],
    }),
    resource: one(resources, {
        fields: [loanResources.resourceId],
        references: [resources.id],
    }),
}));

export const resourcesRelations = relations(resources, ({ one }) => ({
    institution: one(institutions, {
        fields: [resources.institutionId],
        references: [institutions.id],
    }),
    category: one(categories, {
        fields: [resources.categoryId],
        references: [categories.id],
    }),
    template: one(resourceTemplates, {
        fields: [resources.templateId],
        references: [resourceTemplates.id],
    }),
}));

export const classroomReservationsRelations = relations(classroomReservations, ({ one, many }) => ({
    institution: one(institutions, {
        fields: [classroomReservations.institutionId],
        references: [institutions.id],
    }),
    classroom: one(classrooms, {
        fields: [classroomReservations.classroomId],
        references: [classrooms.id],
    }),
    staff: one(staff, {
        fields: [classroomReservations.staffId],
        references: [staff.id],
    }),
    grade: one(grades, {
        fields: [classroomReservations.gradeId],
        references: [grades.id],
    }),
    section: one(sections, {
        fields: [classroomReservations.sectionId],
        references: [sections.id],
    }),
    curricularArea: one(curricularAreas, {
        fields: [classroomReservations.curricularAreaId],
        references: [curricularAreas.id],
    }),
    slots: many(reservationSlots),
    attendance: many(reservationAttendance),
    tasks: many(reservationTasks),
}));

export const classroomsRelations = relations(classrooms, ({ one, many }) => ({
    institution: one(institutions, {
        fields: [classrooms.institutionId],
        references: [institutions.id],
    }),
    reservations: many(classroomReservations),
}));

export const pedagogicalHoursRelations = relations(pedagogicalHours, ({ one, many }) => ({
    institution: one(institutions, {
        fields: [pedagogicalHours.institutionId],
        references: [institutions.id],
    }),
    slots: many(reservationSlots),
}));

export const reservationSlotsRelations = relations(reservationSlots, ({ one }) => ({
    reservation: one(classroomReservations, {
        fields: [reservationSlots.reservationId],
        references: [classroomReservations.id],
    }),
    classroom: one(classrooms, {
        fields: [reservationSlots.classroomId],
        references: [classrooms.id],
    }),
    pedagogicalHour: one(pedagogicalHours, {
        fields: [reservationSlots.pedagogicalHourId],
        references: [pedagogicalHours.id],
    }),
}));

export const reservationAttendanceRelations = relations(reservationAttendance, ({ one }) => ({
    reservation: one(classroomReservations, {
        fields: [reservationAttendance.reservationId],
        references: [classroomReservations.id],
    }),
    staff: one(staff, {
        fields: [reservationAttendance.staffId],
        references: [staff.id],
    }),
}));

export const reservationTasksRelations = relations(reservationTasks, ({ one }) => ({
    reservation: one(classroomReservations, {
        fields: [reservationTasks.reservationId],
        references: [classroomReservations.id],
    }),
    assignedStaff: one(staff, {
        fields: [reservationTasks.assignedStaffId],
        references: [staff.id],
    }),
}));

export const meetingsRelations = relations(meetings, ({ one, many }) => ({
    institution: one(institutions, {
        fields: [meetings.institutionId],
        references: [institutions.id],
    }),
    attendance: many(meetingAttendance),
    tasks: many(meetingTasks),
}));

export const meetingAttendanceRelations = relations(meetingAttendance, ({ one }) => ({
    meeting: one(meetings, {
        fields: [meetingAttendance.meetingId],
        references: [meetings.id],
    }),
    staff: one(staff, {
        fields: [meetingAttendance.staffId],
        references: [staff.id],
    }),
}));

export const meetingTasksRelations = relations(meetingTasks, ({ one }) => ({
    meeting: one(meetings, {
        fields: [meetingTasks.meetingId],
        references: [meetings.id],
    }),
    assignedStaff: one(staff, {
        fields: [meetingTasks.assignedStaffId],
        references: [staff.id],
    }),
}));
