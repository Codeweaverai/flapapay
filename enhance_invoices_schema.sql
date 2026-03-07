-- Add tax_rate and discount_amount to invoices table
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5, 2) DEFAULT 16.00,
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0.00;

-- Optional: Update existing invoices to have the default VAT if they have tax_amount > 0 and tax_rate is null
UPDATE invoices 
SET tax_rate = 16.00 
WHERE tax_amount > 0 AND tax_rate IS NULL;
