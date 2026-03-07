-- Create Help Articles Table
CREATE TABLE IF NOT EXISTS help_articles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[], -- Array of strings
    slug VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Job Postings Table
CREATE TABLE IF NOT EXISTS job_postings (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    department VARCHAR(100) NOT NULL,
    location VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL, -- e.g., Full-time, Contract
    description TEXT NOT NULL,
    requirements TEXT[], -- Array of strings
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Blog Posts Table
CREATE TABLE IF NOT EXISTS blog_posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    author VARCHAR(100) NOT NULL,
    author_role VARCHAR(100),
    author_image VARCHAR(255),
    category VARCHAR(100),
    image_url VARCHAR(255),
    read_time VARCHAR(20),
    slug VARCHAR(255) UNIQUE NOT NULL,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert Mock Data for Help Articles
INSERT INTO help_articles (title, category, content, tags, slug) VALUES
('How to verify your account', 'Account & Settings', 'To verify your account, go to Settings > Verification and upload your ID.', ARRAY['kyc', 'verification'], 'how-to-verify-account'),
('Transaction limits', 'Account & Settings', 'Limits depend on your verification tier. Tier 1 is $1000/day.', ARRAY['limits', 'tiers'], 'transaction-limits'),
('Integrating the API', 'Business & API', 'Get your API keys from the Developer Dashboard.', ARRAY['api', 'developers'], 'integrating-the-api')
ON CONFLICT (slug) DO NOTHING;

-- Insert Mock Data for Job Postings
INSERT INTO job_postings (title, department, location, type, description, requirements) VALUES
('Senior Frontend Engineer', 'Engineering', 'Remote (Africa/Europe)', 'Full-time', 'We are looking for a React expert to build our financial dashboards.', ARRAY['React', 'TypeScript', 'Tailwind CSS']),
('Product Designer', 'Product & Design', 'Lagos, Nigeria', 'Full-time', 'Design the future of payments.', ARRAY['Figma', 'UI/UX', 'Mobile Design']),
('Compliance Officer', 'Compliance & Risk', 'Nairobi, Kenya', 'Full-time', 'Ensure we meet all regulatory requirements.', ARRAY['Legal', 'Finance', 'Risk Management'])
ON CONFLICT DO NOTHING;

-- Insert Mock Data for Blog Posts
INSERT INTO blog_posts (title, excerpt, content, author, author_role, category, image_url, read_time, slug, published_at) VALUES
('The Future of Digital Payments in Africa', 'Exploring the trends shaping the future of digital payments across the African continent.', 'Full content of the article goes here...', 'Kwame Mensah', 'Chief Strategy Officer', 'Industry Insights', 'https://images.unsplash.com/photo-1551836022-d5d88e9218df', '5 min read', 'future-of-digital-payments-africa', NOW()),
('Building Scalable Payment Infrastructure', 'Lessons learned from building payment systems that handle millions of transactions.', 'Technical deep dive...', 'Sarah Johnson', 'VP Engineering', 'Engineering', 'https://images.unsplash.com/photo-1555066931-4365d14bab8c', '8 min read', 'building-scalable-infrastructure', NOW())
ON CONFLICT (slug) DO NOTHING;
