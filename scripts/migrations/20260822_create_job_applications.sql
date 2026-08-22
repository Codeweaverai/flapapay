CREATE TABLE IF NOT EXISTS job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id INTEGER NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(80),
    portfolio_url TEXT,
    cover_note TEXT NOT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'submitted',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_job_applications_job_id ON job_applications(job_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON job_applications TO flapapay;
