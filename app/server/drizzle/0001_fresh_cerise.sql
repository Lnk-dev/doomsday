CREATE TYPE "public"."dispute_status" AS ENUM('open', 'under_review', 'escalated', 'upheld', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."event_category" AS ENUM('technology', 'economic', 'climate', 'war', 'natural', 'social', 'other');--> statement-breakpoint
CREATE TYPE "public"."quality_tier" AS ENUM('bronze', 'silver', 'gold', 'platinum');--> statement-breakpoint
CREATE TYPE "public"."resolution_type" AS ENUM('automatic', 'oracle', 'multi_sig', 'community');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "creator_stakes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"creator_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"outcome" "bet_outcome" NOT NULL,
	"refunded" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "creator_stakes_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "disputes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"disputer_id" uuid NOT NULL,
	"stake_amount" integer NOT NULL,
	"reason" text NOT NULL,
	"evidence" text,
	"status" "dispute_status" DEFAULT 'open' NOT NULL,
	"outcome" text,
	"resolved_by" uuid,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "event_deadlines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"betting_deadline" timestamp NOT NULL,
	"event_deadline" timestamp NOT NULL,
	"resolution_deadline" timestamp NOT NULL,
	"dispute_window_end" timestamp NOT NULL,
	CONSTRAINT "event_deadlines_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "resolution_criteria" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"condition_type" text NOT NULL,
	"description" text NOT NULL,
	"metric" text,
	"operator" text,
	"threshold_value" numeric(18, 6),
	"unit" text,
	"geographic_scope" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "resolution_evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"submitted_by" uuid NOT NULL,
	"evidence_type" text NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "verification_sources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	"name" text NOT NULL,
	"url" text,
	"source_type" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "category" "event_category" DEFAULT 'other';--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "quality_score" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "quality_tier" "quality_tier" DEFAULT 'bronze';--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "resolution_type" "resolution_type" DEFAULT 'oracle';--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "proposed_outcome" "bet_outcome";--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "proposed_at" timestamp;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "creator_stakes" ADD CONSTRAINT "creator_stakes_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "creator_stakes" ADD CONSTRAINT "creator_stakes_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "disputes" ADD CONSTRAINT "disputes_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "disputes" ADD CONSTRAINT "disputes_disputer_id_users_id_fk" FOREIGN KEY ("disputer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "disputes" ADD CONSTRAINT "disputes_resolved_by_admin_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "event_deadlines" ADD CONSTRAINT "event_deadlines_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "resolution_criteria" ADD CONSTRAINT "resolution_criteria_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "resolution_evidence" ADD CONSTRAINT "resolution_evidence_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "resolution_evidence" ADD CONSTRAINT "resolution_evidence_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "verification_sources" ADD CONSTRAINT "verification_sources_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "creator_stakes_event_idx" ON "creator_stakes" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "disputes_event_idx" ON "disputes" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "disputes_disputer_idx" ON "disputes" USING btree ("disputer_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "disputes_status_idx" ON "disputes" USING btree ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "event_deadlines_event_idx" ON "event_deadlines" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "resolution_criteria_event_idx" ON "resolution_criteria" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "resolution_evidence_event_idx" ON "resolution_evidence" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "verification_sources_event_idx" ON "verification_sources" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "events_category_idx" ON "events" USING btree ("category");