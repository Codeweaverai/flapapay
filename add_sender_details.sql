-- Add sender details columns to invoices table
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS sender_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS sender_address TEXT,
ADD COLUMN IF NOT EXISTS sender_phone VARCHAR(50);

-- Ensure APPROVED status is supported (if using enum, otherwise just string)
-- If status is a check constraint, we might need to update it. 
-- Assuming it's just a VARCHAR or TEXT based on previous code usage (status ILIKE ...).
