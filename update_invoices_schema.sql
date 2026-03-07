-- Add Branding and Scheduling fields to invoices table
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS brand_color VARCHAR(20) DEFAULT '#000000',
ADD COLUMN IF NOT EXISTS terms_conditions TEXT,
ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE;

-- Add index for scheduling
CREATE INDEX IF NOT EXISTS idx_invoices_scheduled_at ON invoices(scheduled_at);
