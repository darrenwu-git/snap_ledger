-- Add updated_at column to transactions and categories tables
-- Run this in your Supabase SQL Editor to enable "Last Modified Wins" sync for logged-in users.

ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
