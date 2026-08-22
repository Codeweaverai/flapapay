ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS reviewer_notes TEXT;
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id);
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS applicant_confirmation_sent_at TIMESTAMP;
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS recruiter_alert_sent_at TIMESTAMP;
ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_job_applications_status_created_at ON job_applications(status, created_at DESC);
