// LetsHelp Database Schema
// This extends the base Better Auth schema with LetsHelp-specific tables

import { pgTable, text, timestamp, integer, json, index, pgEnum, boolean } from "drizzle-orm/pg-core";
import { user } from "./schema";

// Enums
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "trialing", "past_due", "canceled", "unpaid"]);
export const subscriptionPlanEnum = pgEnum("subscription_plan", ["monthly", "annual"]);
export const userRoleEnum = pgEnum("user_role", ["senior", "facility_admin", "super_admin", "volunteer"]);
export const sessionStatusEnum = pgEnum("session_status", ["active", "completed", "abandoned", "handed_off"]);
export const handoffStatusEnum = pgEnum("handoff_status", ["pending", "accepted", "declined", "canceled"]);
export const notificationTypeEnum = pgEnum("notification_type", ["session_completed", "session_summary", "handoff_request", "resident_alert", "weekly_report", "daily_report"]);
export const notificationFrequencyEnum = pgEnum("notification_frequency", ["immediate", "daily", "weekly", "none"]);
export const accessCodeStatusEnum = pgEnum("access_code_status", ["active", "used", "revoked", "expired"]);
export const residentStatusEnum = pgEnum("resident_status", ["active", "inactive", "pending_setup"]);

// Facilities (senior living communities)
export const facilities = pgTable(
  "facilities",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name").notNull(),
    address: text("address"),
    contactEmail: text("contact_email"),
    contactPhone: text("contact_phone"),
    stripeCustomerId: text("stripe_customer_id"),
    subscriptionStatus: subscriptionStatusEnum("subscription_status").default("active").notNull(),
    subscriptionPlan: subscriptionPlanEnum("subscription_plan").default("monthly").notNull(),
    pricePerResident: integer("price_per_resident").default(1500).notNull(), // in cents ($15)
    maxResidents: integer("max_residents"),
    settings: json("facility_settings").$type<{
      allowStayLoggedIn?: boolean;
      multiFacilityEnabled?: boolean;
      requireManagerApproval?: boolean;
      sessionTimeout?: number; // in minutes
    }>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("facilities_stripe_idx").on(table.stripeCustomerId)]
);

// Facility-Staff relationship
export const facilityStaff = pgTable(
  "facility_staff",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    facilityId: text("facility_id")
      .notNull()
      .references(() => facilities.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").notNull(), // 'admin' or 'staff'
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("facility_staff_facility_idx").on(table.facilityId),
    index("facility_staff_user_idx").on(table.userId),
  ]
);

// Residents (seniors using the service)
export const residents = pgTable(
  "residents",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    facilityId: text("facility_id").references(() => facilities.id, { onDelete: "set null" }), // null for B2C
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    preferredLanguage: text("preferred_language").default("en").notNull(),
    accessibilitySettings: json("accessibility_settings").$type<{
      fontSize?: "normal" | "large" | "extra-large";
      highContrast?: boolean;
      voiceSpeed?: number;
      darkMode?: boolean;
      autoPlayVoice?: boolean;
      showSubtitles?: boolean;
      lineSpacing?: "normal" | "relaxed" | "loose";
      voiceGender?: "male" | "female" | "neutral";
    }>(),
    dateOfBirth: timestamp("date_of_birth"),
    emergencyContact: json("emergency_contact").$type<{
      name: string;
      phone: string;
      email?: string;
    }>(),
    familyEmail: text("family_email"), // For sending session summaries to family members
    emailSummaries: boolean("email_summaries").default(false), // Opt-in for email summaries
    status: residentStatusEnum("status").default("pending_setup").notNull(), // Track if resident is active/inactive
    lastLoginAt: timestamp("last_login_at"),
    sessionCount30Days: integer("session_count_30_days").default(0).notNull(), // For billing active status
    lastSessionAt: timestamp("last_session_at"),
    needsHelpWith: json("needs_help_with").$type<string[]>(), // AI-tagged learning gaps
    preferencesSetupCompleted: boolean("preferences_setup_completed").default(false), // AI preference setup done
    phone: text("phone"), // For SMS notifications (future)
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("residents_facility_idx").on(table.facilityId),
    index("residents_user_idx").on(table.userId),
    index("residents_status_idx").on(table.status),
  ]
);

// Support sessions
export const supportSessions = pgTable(
  "support_sessions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    residentId: text("resident_id")
      .notNull()
      .references(() => residents.id, { onDelete: "cascade" }),
    facilityId: text("facility_id")
      .references(() => facilities.id, { onDelete: "set null" }),
    startTime: timestamp("start_time").defaultNow().notNull(),
    endTime: timestamp("end_time"),
    duration: integer("duration"), // in seconds
    status: sessionStatusEnum("status").default("active").notNull(),
    issueCategory: text("issue_category"), // 'password', 'app', 'hardware', 'communication', etc.
    issueDescription: text("issue_description"),
    resolution: text("resolution"), // AI summary of resolution
    transcript: text("transcript"), // Full session transcript (formatted)
    summary: text("summary"), // AI-generated summary of the session
    summaryEmailSent: boolean("summary_email_sent").default(false), // Whether summary was emailed
    summaryEmailTo: text("summary_email_to"), // Where the summary was sent
    recordingUrl: text("recording_url"), // Link to stored recording
    aiModel: text("ai_model").default("gemini-2.5-flash-native-audio-preview-12-2025"),
    handedOffTo: text("handed_off_to").references(() => user.id, { onDelete: "set null" }), // Volunteer who took over
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("support_sessions_resident_idx").on(table.residentId),
    index("support_sessions_facility_idx").on(table.facilityId),
    index("support_sessions_status_idx").on(table.status),
    index("support_sessions_start_time_idx").on(table.startTime),
  ]
);

// Session messages (for detailed analytics)
export const sessionMessages = pgTable(
  "session_messages",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    sessionId: text("session_id")
      .notNull()
      .references(() => supportSessions.id, { onDelete: "cascade" }),
    role: text("role").notNull(), // 'user', 'assistant', 'system'
    content: text("content").notNull(),
    timestamp: timestamp("timestamp").defaultNow().notNull(),
    audioTranscript: text("audio_transcript"),
  },
  (table) => [
    index("session_messages_session_idx").on(table.sessionId),
  ]
);

// Volunteer handoff requests
export const handoffRequests = pgTable(
  "handoff_requests",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    sessionId: text("session_id")
      .notNull()
      .references(() => supportSessions.id, { onDelete: "cascade" }),
    residentId: text("resident_id")
      .notNull()
      .references(() => residents.id, { onDelete: "cascade" }),
    status: handoffStatusEnum("status").default("pending").notNull(),
    requestedAt: timestamp("requested_at").defaultNow().notNull(),
    acceptedAt: timestamp("accepted_at"),
    acceptedBy: text("accepted_by").references(() => user.id, { onDelete: "set null" }),
    reason: text("reason"),
  },
  (table) => [
    index("handoff_requests_session_idx").on(table.sessionId),
    index("handoff_requests_status_idx").on(table.status),
  ]
);

// Usage analytics (aggregated)
export const usageAnalytics = pgTable(
  "usage_analytics",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    facilityId: text("facility_id")
      .notNull()
      .references(() => facilities.id, { onDelete: "cascade" }),
    residentId: text("resident_id").references(() => residents.id, { onDelete: "cascade" }), // null for facility-wide
    date: text("date").notNull(), // YYYY-MM-DD format
    totalSessions: integer("total_sessions").default(0).notNull(),
    totalDuration: integer("total_duration").default(0).notNull(), // in seconds
    completedSessions: integer("completed_sessions").default(0).notNull(),
    abandonedSessions: integer("abandoned_sessions").default(0).notNull(),
    handedOffSessions: integer("handed_off_sessions").default(0).notNull(),
    commonIssues: json("common_issues").$type<Record<string, number>>(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("usage_analytics_facility_idx").on(table.facilityId),
    index("usage_analytics_date_idx").on(table.date),
    index("usage_analytics_unique_idx").on(table.facilityId, table.residentId, table.date),
  ]
);

// Invoices
export const invoices = pgTable(
  "invoices",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    facilityId: text("facility_id")
      .notNull()
      .references(() => facilities.id, { onDelete: "cascade" }),
    stripeInvoiceId: text("stripe_invoice_id").unique().notNull(),
    amount: integer("amount").notNull(), // in cents
    currency: text("currency").default("usd").notNull(),
    status: text("status").notNull(), // 'draft', 'open', 'paid', 'void', 'uncollectible'
    periodStart: timestamp("period_start").notNull(),
    periodEnd: timestamp("period_end").notNull(),
    residentCount: integer("resident_count").notNull(),
    pdfUrl: text("pdf_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("invoices_facility_idx").on(table.facilityId),
    index("invoices_stripe_idx").on(table.stripeInvoiceId),
    index("invoices_status_idx").on(table.status),
  ]
);

// User role extensions (extends base user table)
export const userRoles = pgTable(
  "user_roles",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    role: userRoleEnum("role").default("senior").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("user_roles_user_idx").on(table.userId)]
);

// AI Session tokens (for ephemeral token management)
export const aiSessionTokens = pgTable(
  "ai_session_tokens",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    sessionId: text("session_id")
      .notNull()
      .references(() => supportSessions.id, { onDelete: "cascade" }),
    token: text("token").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("ai_session_tokens_session_idx").on(table.sessionId),
    index("ai_session_tokens_expires_idx").on(table.expiresAt),
  ]
);

// Access codes for senior login (secure, one-time use)
export const accessCodes = pgTable(
  "access_codes",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    code: text("code").notNull().unique(), // 6-character uppercase code
    residentId: text("resident_id")
      .notNull()
      .references(() => residents.id, { onDelete: "cascade" }),
    facilityId: text("facility_id")
      .notNull()
      .references(() => facilities.id, { onDelete: "cascade" }),
    status: accessCodeStatusEnum("status").default("active").notNull(),
    expiresAt: timestamp("expires_at"), // Optional expiration
    usedAt: timestamp("used_at"),
    createdBy: text("created_by")
      .references(() => user.id, { onDelete: "set null" }), // Manager who created it
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("access_codes_code_idx").on(table.code),
    index("access_codes_resident_idx").on(table.residentId),
    index("access_codes_facility_idx").on(table.facilityId),
    index("access_codes_status_idx").on(table.status),
  ]
);

// Manager notification preferences
export const managerNotificationPrefs = pgTable(
  "manager_notification_prefs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    facilityId: text("facility_id")
      .notNull()
      .references(() => facilities.id, { onDelete: "cascade" }),
    sessionCompleted: notificationFrequencyEnum("session_completed").default("none").notNull(),
    sessionSummary: notificationFrequencyEnum("session_summary").default("daily").notNull(),
    handoffRequest: notificationFrequencyEnum("handoff_request").default("immediate").notNull(),
    residentAlert: notificationFrequencyEnum("resident_alert").default("daily").notNull(),
    weeklyReport: boolean("weekly_report").default(true).notNull(),
    weeklyReportDay: integer("weekly_report_day").default(0), // 0 = Sunday
    weeklyReportTime: text("weekly_report_time").default("09:00"), // HH:MM format
    dailyReportTime: text("daily_report_time").default("18:00"), // HH:MM format
    emailEnabled: boolean("email_enabled").default(true).notNull(),
    smsEnabled: boolean("sms_enabled").default(false).notNull(), // Future: SMS notifications
    phoneNumber: text("phone_number"), // For SMS
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("manager_notification_prefs_user_idx").on(table.userId),
    index("manager_notification_prefs_facility_idx").on(table.facilityId),
  ]
);

// In-app notifications for managers
export const notifications = pgTable(
  "notifications",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    facilityId: text("facility_id")
      .references(() => facilities.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    link: text("link"), // Optional link to relevant page
    residentId: text("resident_id").references(() => residents.id, { onDelete: "set null" }),
    sessionId: text("session_id").references(() => supportSessions.id, { onDelete: "set null" }),
    read: boolean("read").default(false).notNull(),
    emailSent: boolean("email_sent").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("notifications_user_idx").on(table.userId),
    index("notifications_facility_idx").on(table.facilityId),
    index("notifications_read_idx").on(table.read),
    index("notifications_created_idx").on(table.createdAt),
  ]
);
