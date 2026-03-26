-- Migration: Add checkout duration tracking to abandoned_checkouts table
-- Run this SQL in your Neon database console if drizzle-kit push fails

-- Add checkout_started_at column
ALTER TABLE abandoned_checkouts ADD COLUMN IF NOT EXISTS checkout_started_at TIMESTAMP;

-- Add checkout_ended_at column  
ALTER TABLE abandoned_checkouts ADD COLUMN IF NOT EXISTS checkout_ended_at TIMESTAMP;

-- Add checkout_seconds column
ALTER TABLE abandoned_checkouts ADD COLUMN IF NOT EXISTS checkout_seconds INTEGER DEFAULT 0;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_abandoned_session_id ON abandoned_checkouts(session_id);
