import React, { useState, useEffect } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import {
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Clock,
    Activity,
    Server,
    Database,
    Globe,
    Shield,
    CreditCard,
    Zap,
    Smartphone,
    Mail,
    RefreshCw,
    ChevronDown,
    ChevronUp,
    Book
} from 'lucide-react';

interface ServiceStatus {
    name: string;
    status: 'operational' | 'degraded' | 'outage';
    description: string;
    icon: React.ReactNode;
}

interface Incident {
    id: string;
    title: string;
    status: 'investigating' | 'identified' | 'monitoring' | 'resolved';
    updates: Array<{
        time: string;
        message: string;
    }>;
    createdAt: string;
    resolvedAt?: string;
}

interface Metric {
    name: string;
    value: string;
    change: string;
    positive: boolean;
}

export const StatusPage: React.FC = () => {
    const [lastUpdated, setLastUpdated] = useState(new Date());
    const [expandedIncident, setExpandedIncident] = useState<string | null>(null);

    const services: ServiceStatus[] = [
        {
            name: 'API',
            status: 'operational',
            description: 'All API endpoints responding normally',
            icon: <Server className="w-5 h-5" />
        },
        {
            name: 'Payment Processing',
            status: 'operational',
            description: 'Payments being processed successfully',
            icon: <CreditCard className="w-5 h-5" />
        },
        {
            name: 'Dashboard',
            status: 'operational',
            description: 'Web application fully functional',
            icon: <Activity className="w-5 h-5" />
        },
        {
            name: 'Mobile Apps',
            status: 'operational',
            description: 'iOS and Android apps operational',
            icon: <Smartphone className="w-5 h-5" />
        },
        {
            name: 'Webhooks',
            status: 'operational',
            description: 'Webhook deliveries on schedule',
            icon: <Zap className="w-5 h-5" />
        },
        {
            name: 'Email Service',
            status: 'operational',
            description: 'Email notifications sending normally',
            icon: <Mail className="w-5 h-5" />
        },
        {
            name: 'Database',
            status: 'operational',
            description: 'All database clusters healthy',
            icon: <Database className="w-5 h-5" />
        },
        {
            name: 'Authentication',
            status: 'operational',
            description: 'Login and auth services working',
            icon: <Shield className="w-5 h-5" />
        },
    ];

    const incidents: Incident[] = [
        {
            id: '1',
            title: 'Elevated API Latency in EU Region',
            status: 'monitoring',
            createdAt: '2026-03-07T10:30:00Z',
            updates: [
                {
                    time: '2026-03-07T11:45:00Z',
                    message: 'We have identified the root cause as increased traffic to our EU-West region. Additional capacity has been provisioned and latency is returning to normal levels.'
                },
                {
                    time: '2026-03-07T10:30:00Z',
                    message: 'We are investigating reports of elevated API latency in the EU-West region. Our team is actively working on this issue.'
                }
            ]
        },
        {
            id: '2',
            title: 'Scheduled Maintenance: Database Upgrade',
            status: 'resolved',
            createdAt: '2026-03-05T02:00:00Z',
            resolvedAt: '2026-03-05T06:00:00Z',
            updates: [
                {
                    time: '2026-03-05T06:00:00Z',
                    message: 'Maintenance has been completed successfully. All systems are now operating normally. Thank you for your patience.'
                },
                {
                    time: '2026-03-05T02:00:00Z',
                    message: 'Scheduled maintenance window has begun. Our engineering team is performing a database upgrade to improve performance.'
                }
            ]
        }
    ];

    const metrics: Metric[] = [
        { name: 'Uptime (30d)', value: '99.99%', change: '+0.01%', positive: true },
        { name: 'Avg Response Time', value: '45ms', change: '-12ms', positive: true },
        { name: 'Requests/sec', value: '12,450', change: '+8.2%', positive: true },
        { name: 'Success Rate', value: '99.97%', change: '+0.02%', positive: true },
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'operational':
                return 'text-green-500 bg-green-500/10 border-green-500/20';
            case 'degraded':
                return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
            case 'outage':
                return 'text-red-500 bg-red-500/10 border-red-500/20';
            default:
                return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'operational':
                return <CheckCircle2 className="w-5 h-5" />;
            case 'degraded':
                return <AlertTriangle className="w-5 h-5" />;
            case 'outage':
                return <XCircle className="w-5 h-5" />;
            default:
                return <Clock className="w-5 h-5" />;
        }
    };

    const getIncidentStatusColor = (status: string) => {
        switch (status) {
            case 'investigating':
                return 'bg-red-500/10 text-red-400 border-red-500/20';
            case 'identified':
                return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
            case 'monitoring':
                return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'resolved':
                return 'bg-green-500/10 text-green-400 border-green-500/20';
            default:
                return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
        }
    };

    useEffect(() => {
        const timer = setInterval(() => setLastUpdated(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const allOperational = services.every(s => s.status === 'operational');

    return (
        <div className="min-h-screen bg-[#0A0A0A] font-sans selection:bg-purple-100">
            <Navbar />

            <main className="pt-20">
                {/* Hero Section */}
                <section className="relative border-b border-gray-800 py-24 bg-gradient-to-b from-gray-900/50 to-black">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-b from-green-500/5 to-transparent rounded-full blur-3xl"></div>
                    </div>

                    <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="text-center">
                            {/* Status Indicator */}
                            <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full border mb-8 ${
                                allOperational 
                                    ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                                    : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                            }`}>
                                {allOperational ? (
                                    <CheckCircle2 className="w-5 h-5" />
                                ) : (
                                    <AlertTriangle className="w-5 h-5" />
                                )}
                                <span className="text-sm font-black uppercase tracking-widest">
                                    {allOperational ? 'All Systems Operational' : 'Partial System Outage'}
                                </span>
                            </div>

                            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight">
                                System Status
                            </h1>
                            <p className="text-xl text-gray-400 font-medium leading-relaxed mb-8 max-w-2xl mx-auto">
                                Real-time status and historical performance data for all FlapaPay services.
                            </p>

                            {/* Last Updated */}
                            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                                <RefreshCw className="w-4 h-4" />
                                <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Metrics */}
                <section className="border-b border-gray-800 py-12 bg-black">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {metrics.map((metric, i) => (
                                <div key={i} className="text-center p-6 rounded-2xl bg-gray-900/50 border border-gray-800">
                                    <p className="text-3xl font-black text-white mb-2">{metric.value}</p>
                                    <p className="text-sm font-bold text-gray-400 mb-2">{metric.name}</p>
                                    <span className={`text-xs font-black ${metric.positive ? 'text-green-400' : 'text-red-400'}`}>
                                        {metric.change}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Services Status */}
                <section className="py-16 bg-black">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-black text-white">Service Status</h2>
                            <span className="text-sm text-gray-500 font-medium">
                                {services.filter(s => s.status === 'operational').length}/{services.length} services operational
                            </span>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {services.map((service, i) => (
                                <div
                                    key={i}
                                    className={`p-5 rounded-2xl border transition-all ${
                                        service.status === 'operational'
                                            ? 'bg-gray-900/50 border-gray-800 hover:border-green-500/30'
                                            : service.status === 'degraded'
                                            ? 'bg-yellow-500/5 border-yellow-500/20'
                                            : 'bg-red-500/5 border-red-500/20'
                                    }`}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className={`p-2 rounded-xl ${getStatusColor(service.status)}`}>
                                            {service.icon}
                                        </div>
                                        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${getStatusColor(service.status)}`}>
                                            {getStatusIcon(service.status)}
                                            {service.status}
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-black text-white mb-1">{service.name}</h3>
                                    <p className="text-sm text-gray-400 font-medium">{service.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Uptime History */}
                <section className="py-16 bg-black border-t border-gray-800">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <h2 className="text-2xl font-black text-white mb-8">30-Day Uptime History</h2>
                        
                        <div className="space-y-4">
                            {services.slice(0, 4).map((service, i) => (
                                <div key={i} className="p-5 rounded-2xl bg-gray-900/50 border border-gray-800">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="text-gray-400">{service.icon}</div>
                                            <span className="font-bold text-white">{service.name}</span>
                                        </div>
                                        <span className="text-sm font-black text-green-400">99.9{i}%</span>
                                    </div>
                                    <div className="flex gap-1">
                                        {Array.from({ length: 30 }).map((_, day) => {
                                            const hasOutage = Math.random() > 0.95;
                                            const hasDegraded = Math.random() > 0.9;
                                            return (
                                                <div
                                                    key={day}
                                                    className={`flex-1 h-8 rounded-sm ${
                                                        hasOutage
                                                            ? 'bg-red-500'
                                                            : hasDegraded
                                                            ? 'bg-yellow-500'
                                                            : 'bg-green-500'
                                                    }`}
                                                    title={`Day ${day + 1}: ${hasOutage ? 'Outage' : hasDegraded ? 'Degraded' : 'Operational'}`}
                                                />
                                            );
                                        })}
                                    </div>
                                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                                        <span>30 days ago</span>
                                        <span>Today</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Legend */}
                        <div className="flex items-center justify-center gap-6 mt-8">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-sm bg-green-500"></div>
                                <span className="text-xs text-gray-400 font-medium">Operational</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-sm bg-yellow-500"></div>
                                <span className="text-xs text-gray-400 font-medium">Degraded</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-sm bg-red-500"></div>
                                <span className="text-xs text-gray-400 font-medium">Outage</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Incidents */}
                <section className="py-16 bg-black border-t border-gray-800">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <h2 className="text-2xl font-black text-white mb-8">Recent Incidents</h2>

                        <div className="space-y-4">
                            {incidents.map((incident) => (
                                <div
                                    key={incident.id}
                                    className="rounded-2xl bg-gray-900/50 border border-gray-800 overflow-hidden"
                                >
                                    <button
                                        onClick={() => setExpandedIncident(expandedIncident === incident.id ? null : incident.id)}
                                        className="w-full p-6 flex items-center justify-between text-left hover:bg-gray-900 transition-colors"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${getIncidentStatusColor(incident.status)}`}>
                                                {incident.status}
                                            </div>
                                            <h3 className="text-lg font-bold text-white">{incident.title}</h3>
                                        </div>
                                        {expandedIncident === incident.id ? (
                                            <ChevronUp className="w-5 h-5 text-gray-400" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-gray-400" />
                                        )}
                                    </button>

                                    {expandedIncident === incident.id && (
                                        <div className="px-6 pb-6 border-t border-gray-800 pt-4">
                                            <div className="space-y-4">
                                                {incident.updates.map((update, i) => (
                                                    <div key={i} className="flex gap-4">
                                                        <div className="w-24 shrink-0">
                                                            <span className="text-xs text-gray-500 font-medium">
                                                                {new Date(update.time).toLocaleString()}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-300 font-medium flex-1">
                                                            {update.message}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Subscribe to Updates */}
                <section className="py-16 bg-black border-t border-gray-800">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-3xl border border-purple-500/20 p-12 text-center">
                            <h2 className="text-3xl font-black text-white mb-4">Stay Informed</h2>
                            <p className="text-gray-400 font-medium mb-8 max-w-xl mx-auto">
                                Subscribe to receive status updates and incident notifications directly to your inbox.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="flex-1 px-6 py-4 rounded-xl bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                />
                                <button className="px-8 py-4 rounded-xl bg-purple-500 text-white font-black hover:bg-purple-600 transition-all">
                                    Subscribe
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-4">
                                We only send important updates. No spam, unsubscribe anytime.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Support Links */}
                <section className="py-16 bg-black border-t border-gray-800">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="grid md:grid-cols-3 gap-6">
                            <a href="/documentation" className="p-6 rounded-2xl bg-gray-900/50 border border-gray-800 hover:border-purple-500/30 transition-all group">
                                <Book className="w-8 h-8 text-purple-400 mb-4" />
                                <h3 className="text-lg font-black text-white mb-2">Documentation</h3>
                                <p className="text-sm text-gray-400 font-medium">Learn how to integrate and use FlapaPay APIs</p>
                            </a>
                            <a href="/contact" className="p-6 rounded-2xl bg-gray-900/50 border border-gray-800 hover:border-purple-500/30 transition-all group">
                                <Mail className="w-8 h-8 text-purple-400 mb-4" />
                                <h3 className="text-lg font-black text-white mb-2">Contact Support</h3>
                                <p className="text-sm text-gray-400 font-medium">Get help from our support team</p>
                            </a>
                            <a href="https://status.flapapay.com/api" className="p-6 rounded-2xl bg-gray-900/50 border border-gray-800 hover:border-purple-500/30 transition-all group">
                                <Globe className="w-8 h-8 text-purple-400 mb-4" />
                                <h3 className="text-lg font-black text-white mb-2">Status API</h3>
                                <p className="text-sm text-gray-400 font-medium">Access status data programmatically</p>
                            </a>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
};
