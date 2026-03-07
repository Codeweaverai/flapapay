import React from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import {
    Shield,
    Lock,
    Key,
    Eye,
    Server,
    Globe,
    CheckCircle2,
    AlertTriangle,
    Fingerprint,
    Database,
    Clock,
    Award,
    Users,
    Zap,
    FileCheck,
    Smartphone,
    CreditCard
} from 'lucide-react';

export const SecurityPage: React.FC = () => {
    const sections = [
        { id: 'overview', title: '1. Security Overview', icon: <Shield className="w-5 h-5" /> },
        { id: 'infrastructure', title: '2. Infrastructure', icon: <Server className="w-5 h-5" /> },
        { id: 'encryption', title: '3. Data Encryption', icon: <Lock className="w-5 h-5" /> },
        { id: 'authentication', title: '4. Authentication', icon: <Fingerprint className="w-5 h-5" /> },
        { id: 'monitoring', title: '5. Real-time Monitoring', icon: <Eye className="w-5 h-5" /> },
        { id: 'compliance', title: '6. Compliance', icon: <FileCheck className="w-5 h-5" /> },
        { id: 'fraud', title: '7. Fraud Prevention', icon: <AlertTriangle className="w-5 h-5" /> },
        { id: 'privacy', title: '8. Data Privacy', icon: <Database className="w-5 h-5" /> },
    ];

    return (
        <div className="min-h-screen bg-[#F9FAFB] font-sans selection:bg-orange-100">
            <Navbar />

            <main className="pt-20">
                {/* Hero Section */}
                <section className="relative overflow-hidden bg-white border-b border-gray-100 py-32">
                    <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-orange-100/30 to-transparent rounded-full -ml-64 -mt-64 blur-3xl pointer-events-none"></div>
                    <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-gradient-to-tl from-yellow-100/30 to-transparent rounded-full -mr-48 -mb-48 blur-3xl pointer-events-none"></div>

                    <div className="relative mx-auto max-w-7xl px-6 lg:px-8 text-center">
                        <div className="inline-flex items-center px-4 py-2 rounded-full bg-orange-50 border border-orange-100 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <span className="flex h-2 w-2 rounded-full bg-orange-500 mr-3 animate-pulse"></span>
                            <span className="text-xs font-black text-orange-600 uppercase tracking-widest">Trust & Security</span>
                        </div>
                        <h1 className="text-5xl md:text-8xl font-black text-gray-900 mb-8 tracking-tight leading-tight">
                            Enterprise-Grade <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-yellow-500">Security Infrastructure</span>
                        </h1>
                        <p className="text-xl text-gray-500 max-w-2xl mx-auto font-medium leading-relaxed">
                            Your trust is our foundation. We employ bank-level security measures, advanced encryption, and continuous monitoring to protect your data and transactions 24/7.
                        </p>
                    </div>
                </section>

                {/* Stats Section */}
                <section className="py-16 bg-white border-b border-gray-100">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                            {[
                                { value: '99.99%', label: 'Uptime SLA', icon: <Clock className="w-6 h-6" /> },
                                { value: 'PCI-DSS', label: 'Level 1 Certified', icon: <Award className="w-6 h-6" /> },
                                { value: '256-bit', label: 'Encryption Standard', icon: <Key className="w-6 h-6" /> },
                                { value: '24/7', label: 'Security Monitoring', icon: <Eye className="w-6 h-6" /> },
                            ].map((stat, i) => (
                                <div key={i} className="text-center p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-100">
                                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-orange-100 text-orange-600 mb-4">
                                        {stat.icon}
                                    </div>
                                    <p className="text-3xl font-black text-gray-900 mb-2">{stat.value}</p>
                                    <p className="text-sm font-bold text-gray-500">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="py-24">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="flex flex-col lg:flex-row gap-16">
                            {/* Sticky Sidebar Navigation */}
                            <aside className="hidden lg:block w-72 shrink-0">
                                <div className="sticky top-32 space-y-2">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 px-4">Security Sections</p>
                                    {sections.map((section) => (
                                        <a
                                            key={section.id}
                                            href={`#${section.id}`}
                                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-gray-500 hover:bg-orange-50 hover:text-orange-600 transition-all group"
                                        >
                                            <span className="text-gray-400 group-hover:text-orange-500 transition-colors">{section.icon}</span>
                                            {section.title}
                                        </a>
                                    ))}
                                </div>
                            </aside>

                            {/* Main Content */}
                            <div className="flex-1 max-w-4xl">
                                {/* Overview */}
                                <section id="overview" className="mb-20 scroll-mt-32">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600">
                                            <Shield className="w-6 h-6" />
                                        </div>
                                        <h2 className="text-3xl font-black text-gray-900">1. Security Overview</h2>
                                    </div>
                                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                                        <p className="text-gray-600 font-medium leading-relaxed mb-6">
                                            At FlapaPay, security is not an afterthought—it's embedded in every layer of our platform. We employ a defense-in-depth strategy with multiple security controls to protect your data, transactions, and digital assets.
                                        </p>
                                        <div className="grid md:grid-cols-2 gap-6 mt-8">
                                            {[
                                                { title: 'Multi-Layer Security', desc: 'Defense at network, application, and data layers' },
                                                { title: 'Zero Trust Architecture', desc: 'Verify every request, never trust by default' },
                                                { title: 'End-to-End Encryption', desc: 'Data encrypted in transit and at rest' },
                                                { title: 'Continuous Monitoring', desc: '24/7 threat detection and response' },
                                            ].map((item, i) => (
                                                <div key={i} className="flex items-start gap-4 p-5 rounded-2xl bg-orange-50 border border-orange-100">
                                                    <CheckCircle2 className="w-6 h-6 text-orange-600 mt-0.5 shrink-0" />
                                                    <div>
                                                        <p className="text-sm font-black text-gray-900 mb-1">{item.title}</p>
                                                        <p className="text-xs text-gray-600 font-medium">{item.desc}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </section>

                                {/* Infrastructure */}
                                <section id="infrastructure" className="mb-20 scroll-mt-32">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600">
                                            <Server className="w-6 h-6" />
                                        </div>
                                        <h2 className="text-3xl font-black text-gray-900">2. Infrastructure Security</h2>
                                    </div>
                                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                                        <p className="text-gray-600 font-medium leading-relaxed mb-6">
                                            Our infrastructure is built on enterprise-grade cloud providers with industry-leading physical and network security.
                                        </p>
                                        <div className="space-y-4">
                                            {[
                                                {
                                                    title: 'Tier IV Data Centers',
                                                    desc: 'Redundant power, cooling, and network connectivity with 99.995% uptime guarantee',
                                                    icon: <Server className="w-5 h-5" />
                                                },
                                                {
                                                    title: 'Network Segmentation',
                                                    desc: 'Isolated environments for production, staging, and development with strict access controls',
                                                    icon: <Globe className="w-5 h-5" />
                                                },
                                                {
                                                    title: 'DDoS Protection',
                                                    desc: 'Multi-terabit DDoS mitigation with automatic traffic scrubbing and rate limiting',
                                                    icon: <Shield className="w-5 h-5" />
                                                },
                                                {
                                                    title: 'Web Application Firewall',
                                                    desc: 'Real-time protection against OWASP Top 10 vulnerabilities and custom attack patterns',
                                                    icon: <Zap className="w-5 h-5" />
                                                },
                                                {
                                                    title: 'Disaster Recovery',
                                                    desc: 'Geographic redundancy with automated failover and regular disaster recovery drills',
                                                    icon: <Database className="w-5 h-5" />
                                                },
                                            ].map((item, i) => (
                                                <div key={i} className="flex items-start gap-4 p-5 rounded-2xl bg-gray-50 border border-gray-100 hover:border-purple-200 transition-all">
                                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-purple-600 shrink-0">
                                                        {item.icon}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-gray-900 mb-1">{item.title}</p>
                                                        <p className="text-xs text-gray-600 font-medium">{item.desc}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </section>

                                {/* Encryption */}
                                <section id="encryption" className="mb-20 scroll-mt-32">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600">
                                            <Lock className="w-6 h-6" />
                                        </div>
                                        <h2 className="text-3xl font-black text-gray-900">3. Data Encryption</h2>
                                    </div>
                                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                                        <p className="text-gray-600 font-medium leading-relaxed mb-6">
                                            All data is encrypted using industry-leading algorithms and key management practices.
                                        </p>
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="p-6 rounded-2xl bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-100">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <Lock className="w-6 h-6 text-orange-600" />
                                                    <h3 className="text-lg font-black text-gray-900">In Transit</h3>
                                                </div>
                                                <ul className="space-y-3">
                                                    {[
                                                        'TLS 1.3 for all API and web traffic',
                                                        'Perfect Forward Secrecy (PFS) enabled',
                                                        'HSTS enforced on all endpoints',
                                                        'Certificate pinning for mobile apps',
                                                    ].map((item, i) => (
                                                        <li key={i} className="flex items-start gap-2">
                                                            <CheckCircle2 className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
                                                            <span className="text-xs text-gray-700 font-medium">{item}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div className="p-6 rounded-2xl bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-100">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <Database className="w-6 h-6 text-blue-600" />
                                                    <h3 className="text-lg font-black text-gray-900">At Rest</h3>
                                                </div>
                                                <ul className="space-y-3">
                                                    {[
                                                        'AES-256 encryption for all databases',
                                                        'Encrypted file storage (S3 SSE-KMS)',
                                                        'Hardware Security Modules (HSM) for keys',
                                                        'Automatic key rotation every 90 days',
                                                    ].map((item, i) => (
                                                        <li key={i} className="flex items-start gap-2">
                                                            <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                                                            <span className="text-xs text-gray-700 font-medium">{item}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                        <div className="mt-6 p-5 rounded-2xl bg-gray-50 border border-gray-100">
                                            <div className="flex items-center gap-3 mb-3">
                                                <Key className="w-5 h-5 text-orange-600" />
                                                <h3 className="text-sm font-black text-gray-900">Key Management</h3>
                                            </div>
                                            <p className="text-sm text-gray-600 font-medium">
                                                Encryption keys are managed using AWS KMS and HashiCorp Vault with strict access controls, audit logging, and separation of duties. Keys never leave the secure key management environment in plaintext.
                                            </p>
                                        </div>
                                    </div>
                                </section>

                                {/* Authentication */}
                                <section id="authentication" className="mb-20 scroll-mt-32">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600">
                                            <Fingerprint className="w-6 h-6" />
                                        </div>
                                        <h2 className="text-3xl font-black text-gray-900">4. Authentication & Access</h2>
                                    </div>
                                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                                        <p className="text-gray-600 font-medium leading-relaxed mb-6">
                                            Multi-factor authentication and granular access controls ensure only authorized users can access sensitive systems and data.
                                        </p>
                                        <div className="space-y-4">
                                            {[
                                                {
                                                    title: 'Multi-Factor Authentication (MFA)',
                                                    desc: 'Required for all user accounts. Supports TOTP apps, SMS, and hardware security keys (YubiKey).',
                                                    icon: <Smartphone className="w-5 h-5" />
                                                },
                                                {
                                                    title: 'Biometric Authentication',
                                                    desc: 'Fingerprint and face recognition support on mobile devices for seamless secure access.',
                                                    icon: <Fingerprint className="w-5 h-5" />
                                                },
                                                {
                                                    title: 'Role-Based Access Control (RBAC)',
                                                    desc: 'Granular permissions based on job functions with principle of least privilege.',
                                                    icon: <Users className="w-5 h-5" />
                                                },
                                                {
                                                    title: 'Session Management',
                                                    desc: 'Secure session tokens with automatic timeout, device tracking, and remote logout capability.',
                                                    icon: <Clock className="w-5 h-5" />
                                                },
                                                {
                                                    title: 'API Authentication',
                                                    desc: 'OAuth 2.0 and JWT-based authentication with short-lived tokens and refresh token rotation.',
                                                    icon: <Key className="w-5 h-5" />
                                                },
                                            ].map((item, i) => (
                                                <div key={i} className="flex items-start gap-4 p-5 rounded-2xl bg-gray-50 border border-gray-100 hover:border-orange-200 transition-all">
                                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-orange-600 shrink-0">
                                                        {item.icon}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-gray-900 mb-1">{item.title}</p>
                                                        <p className="text-xs text-gray-600 font-medium">{item.desc}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </section>

                                {/* Monitoring */}
                                <section id="monitoring" className="mb-20 scroll-mt-32">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600">
                                            <Eye className="w-6 h-6" />
                                        </div>
                                        <h2 className="text-3xl font-black text-gray-900">5. Real-time Monitoring</h2>
                                    </div>
                                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                                        <p className="text-gray-600 font-medium leading-relaxed mb-6">
                                            Our Security Operations Center (SOC) monitors all systems 24/7 with automated threat detection and incident response.
                                        </p>
                                        <div className="grid md:grid-cols-3 gap-6 mb-8">
                                            {[
                                                { value: '< 5 min', label: 'Mean Time to Detect', icon: <Eye className="w-6 h-6" /> },
                                                { value: '< 15 min', label: 'Mean Time to Respond', icon: <Zap className="w-6 h-6" /> },
                                                { value: '100%', label: 'Log Coverage', icon: <FileCheck className="w-6 h-6" /> },
                                            ].map((stat, i) => (
                                                <div key={i} className="text-center p-5 rounded-2xl bg-orange-50 border border-orange-100">
                                                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-orange-100 text-orange-600 mb-3">
                                                        {stat.icon}
                                                    </div>
                                                    <p className="text-2xl font-black text-gray-900 mb-1">{stat.value}</p>
                                                    <p className="text-xs font-bold text-gray-500">{stat.label}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="space-y-4">
                                            {[
                                                'Security Information and Event Management (SIEM) aggregation',
                                                'User and Entity Behavior Analytics (UEBA) for anomaly detection',
                                                'Automated alerting with on-call escalation procedures',
                                                'Comprehensive audit logs retained for 7+ years',
                                                'Regular penetration testing by third-party firms',
                                                'Bug bounty program for responsible disclosure',
                                            ].map((item, i) => (
                                                <li key={i} className="flex items-start gap-3">
                                                    <CheckCircle2 className="w-5 h-5 text-orange-500 mt-0.5 shrink-0" />
                                                    <span className="text-gray-600 font-medium">{item}</span>
                                                </li>
                                            ))}
                                        </div>
                                    </div>
                                </section>

                                {/* Compliance */}
                                <section id="compliance" className="mb-20 scroll-mt-32">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600">
                                            <FileCheck className="w-6 h-6" />
                                        </div>
                                        <h2 className="text-3xl font-black text-gray-900">6. Compliance & Certifications</h2>
                                    </div>
                                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                                        <p className="text-gray-600 font-medium leading-relaxed mb-6">
                                            FlapaPay maintains compliance with global security and privacy standards to ensure your data is handled according to the highest industry requirements.
                                        </p>
                                        <div className="grid md:grid-cols-2 gap-6">
                                            {[
                                                {
                                                    cert: 'PCI-DSS Level 1',
                                                    desc: 'Highest level of payment card industry security certification',
                                                    status: 'Certified'
                                                },
                                                {
                                                    cert: 'SOC 2 Type II',
                                                    desc: 'Independent audit of security, availability, and confidentiality controls',
                                                    status: 'Certified'
                                                },
                                                {
                                                    cert: 'ISO 27001',
                                                    desc: 'International standard for information security management',
                                                    status: 'Certified'
                                                },
                                                {
                                                    cert: 'GDPR',
                                                    desc: 'EU General Data Protection Regulation compliance for data privacy',
                                                    status: 'Compliant'
                                                },
                                                {
                                                    cert: 'PSD2',
                                                    desc: 'EU Payment Services Directive 2 for open banking and SCA',
                                                    status: 'Compliant'
                                                },
                                                {
                                                    cert: 'AML/KYC',
                                                    desc: 'Anti-Money Laundering and Know Your Customer procedures',
                                                    status: 'Compliant'
                                                },
                                            ].map((item, i) => (
                                                <div key={i} className="p-6 rounded-2xl bg-gray-50 border border-gray-100 hover:border-orange-200 transition-all">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h3 className="text-lg font-black text-gray-900">{item.cert}</h3>
                                                        <span className={`px-3 py-1 rounded-full text-xs font-black ${item.status === 'Certified' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                            {item.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 font-medium">{item.desc}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </section>

                                {/* Fraud Prevention */}
                                <section id="fraud" className="mb-20 scroll-mt-32">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600">
                                            <AlertTriangle className="w-6 h-6" />
                                        </div>
                                        <h2 className="text-3xl font-black text-gray-900">7. Fraud Prevention</h2>
                                    </div>
                                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                                        <p className="text-gray-600 font-medium leading-relaxed mb-6">
                                            Advanced machine learning and rule-based systems detect and prevent fraudulent transactions in real-time.
                                        </p>
                                        <div className="grid md:grid-cols-2 gap-6 mb-8">
                                            <div className="p-6 rounded-2xl bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-100">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <Zap className="w-6 h-6 text-orange-600" />
                                                    <h3 className="text-lg font-black text-gray-900">Real-time Detection</h3>
                                                </div>
                                                <ul className="space-y-3">
                                                    {[
                                                        'Machine learning risk scoring on every transaction',
                                                        'Device fingerprinting and behavioral biometrics',
                                                        'Velocity checks and pattern recognition',
                                                        'Geolocation and IP reputation analysis',
                                                    ].map((item, i) => (
                                                        <li key={i} className="flex items-start gap-2">
                                                            <CheckCircle2 className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
                                                            <span className="text-xs text-gray-700 font-medium">{item}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div className="p-6 rounded-2xl bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-100">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <Shield className="w-6 h-6 text-orange-600" />
                                                    <h3 className="text-lg font-black text-gray-900">Protection Measures</h3>
                                                </div>
                                                <ul className="space-y-3">
                                                    {[
                                                        '3D Secure 2.0 for card-not-present transactions',
                                                        'Address Verification Service (AVS)',
                                                        'CVV/CVC verification requirements',
                                                        'Automatic blocking of suspicious transactions',
                                                    ].map((item, i) => (
                                                        <li key={i} className="flex items-start gap-2">
                                                            <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                                                            <span className="text-xs text-gray-700 font-medium">{item}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                        <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100">
                                            <p className="text-sm text-gray-600 font-medium">
                                                <span className="font-black text-gray-900">Fraud Guarantee:</span> Eligible merchants are protected against unauthorized transaction chargebacks up to $50,000 per year with our Fraud Protection Program.
                                            </p>
                                        </div>
                                    </div>
                                </section>

                                {/* Privacy */}
                                <section id="privacy" className="mb-20 scroll-mt-32">
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600">
                                            <Database className="w-6 h-6" />
                                        </div>
                                        <h2 className="text-3xl font-black text-gray-900">8. Data Privacy</h2>
                                    </div>
                                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                                        <p className="text-gray-600 font-medium leading-relaxed mb-6">
                                            Your data belongs to you. We implement strict data minimization, purpose limitation, and user control principles.
                                        </p>
                                        <div className="space-y-4">
                                            {[
                                                {
                                                    title: 'Data Minimization',
                                                    desc: 'We only collect data necessary for providing our services and complying with regulations.',
                                                    icon: <CreditCard className="w-5 h-5" />
                                                },
                                                {
                                                    title: 'User Rights',
                                                    desc: 'Access, rectify, export, or delete your data at any time through your account settings.',
                                                    icon: <Users className="w-5 h-5" />
                                                },
                                                {
                                                    title: 'Consent Management',
                                                    desc: 'Granular consent controls for marketing, analytics, and third-party data sharing.',
                                                    icon: <FileCheck className="w-5 h-5" />
                                                },
                                                {
                                                    title: 'Data Retention',
                                                    desc: 'Automatic deletion of inactive accounts and data after legally required retention periods.',
                                                    icon: <Clock className="w-5 h-5" />
                                                },
                                                {
                                                    title: 'Third-Party Controls',
                                                    desc: 'Strict vendor assessment and data processing agreements for all service providers.',
                                                    icon: <Globe className="w-5 h-5" />
                                                },
                                            ].map((item, i) => (
                                                <div key={i} className="flex items-start gap-4 p-5 rounded-2xl bg-gray-50 border border-gray-100 hover:border-orange-200 transition-all">
                                                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-orange-600 shrink-0">
                                                        {item.icon}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-gray-900 mb-1">{item.title}</p>
                                                        <p className="text-xs text-gray-600 font-medium">{item.desc}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </section>

                                {/* CTA Section */}
                                <section className="bg-gradient-to-br from-orange-500 to-yellow-600 rounded-3xl p-12 text-center">
                                    <h2 className="text-3xl font-black text-white mb-6">Questions About Security?</h2>
                                    <p className="text-orange-100 font-medium mb-8 max-w-xl mx-auto">
                                        Our security team is available to answer questions, provide documentation, or discuss your specific compliance requirements.
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                        <a href="/contact" className="inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-white text-orange-600 font-black hover:bg-orange-50 transition-all">
                                            Contact Security Team
                                        </a>
                                        <a href="/trust" className="inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-orange-600 text-white font-black border border-orange-500 hover:bg-orange-700 transition-all">
                                            View Trust Center
                                        </a>
                                    </div>
                                </section>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};
