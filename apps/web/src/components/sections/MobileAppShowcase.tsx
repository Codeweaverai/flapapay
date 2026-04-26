import React, { useState, useEffect } from 'react';
import ReactCountryFlag from 'react-country-flag';
import { 
    Smartphone, 
    Shield, 
    Zap, 
    Globe, 
    ArrowRight, 
    ArrowDown,
    Download,
    CreditCard,
    Send,
    Wallet,
    BarChart3,
    Bell,
    ScanLine,
    Fingerprint,
    Lock,
    TrendingUp,
    Users,
    CheckCircle2,
    Plus,
    MoreHorizontal,
    Eye,
    EyeOff,
    Repeat,
    Settings,
    Info
} from 'lucide-react';

export const MobileAppShowcase: React.FC = () => {
    const [activeScreen, setActiveScreen] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [showBalance, setShowBalance] = useState(true);

    const appScreens = [
        {
            id: 'home',
            title: 'Dashboard',
            icon: Wallet,
            gradient: 'from-orange-500 to-amber-500',
            content: (
                <div className="h-full flex flex-col">
                    {/* Header */}
                    <div className="px-6 pt-14 pb-4 flex justify-between items-center">
                        <div>
                            <p className="text-xs text-white/70 font-medium">Good Morning</p>
                            <h4 className="text-lg font-bold text-white">Alex Mwangi</h4>
                        </div>
                        <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
                            <Bell className="w-5 h-5 text-white" />
                        </div>
                    </div>

                    {/* Multi-Currency Wallet Cards */}
                    <div className="px-6 mt-4 space-y-3">
                        {/* USD Wallet */}
                        <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-3xl p-5 relative overflow-hidden shadow-2xl">
                            <div className="absolute -top-16 -right-16 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <ReactCountryFlag countryCode="US" svg style={{ width: '20px', height: '14px', borderRadius: '3px' }} />
                                        <span className="text-xs text-white/80 font-bold">USD Wallet</span>
                                    </div>
                                    <div className="px-2 py-1 bg-white/20 rounded-lg">
                                        <span className="text-[10px] font-black text-white">PRIMARY</span>
                                    </div>
                                </div>
                                <div className="flex items-baseline gap-1 mb-3">
                                    <span className="text-2xl font-black text-white">$</span>
                                    <h3 className="text-3xl font-black text-white">
                                        {showBalance ? '24,580.45' : '••••••'}
                                    </h3>
                                </div>
                                <div className="flex gap-2">
                                    <button className="flex-1 py-2.5 bg-white rounded-xl text-xs font-black text-green-700 flex items-center justify-center gap-2 hover:bg-white/90 transition-colors">
                                        <Send className="w-3.5 h-3.5" /> Send
                                    </button>
                                    <button className="flex-1 py-2.5 bg-white/20 rounded-xl text-xs font-black text-white flex items-center justify-center gap-2 hover:bg-white/30 transition-colors">
                                        <Plus className="w-3.5 h-3.5" /> Add
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* ZMW Wallet */}
                        <div className="bg-gradient-to-br from-orange-600 to-amber-700 rounded-3xl p-5 relative overflow-hidden shadow-2xl">
                            <div className="absolute -top-16 -right-16 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <ReactCountryFlag countryCode="ZM" svg style={{ width: '20px', height: '14px', borderRadius: '3px' }} />
                                        <span className="text-xs text-white/80 font-bold">ZMW Wallet</span>
                                    </div>
                                </div>
                                <div className="flex items-baseline gap-1 mb-3">
                                    <span className="text-2xl font-black text-white">K</span>
                                    <h3 className="text-3xl font-black text-white">
                                        {showBalance ? '648,234.50' : '••••••'}
                                    </h3>
                                </div>
                                <div className="flex gap-2">
                                    <button className="flex-1 py-2.5 bg-white rounded-xl text-xs font-black text-orange-700 flex items-center justify-center gap-2 hover:bg-white/90 transition-colors">
                                        <Send className="w-3.5 h-3.5" /> Send
                                    </button>
                                    <button className="flex-1 py-2.5 bg-white/20 rounded-xl text-xs font-black text-white flex items-center justify-center gap-2 hover:bg-white/30 transition-colors">
                                        <Plus className="w-3.5 h-3.5" /> Add
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Balance Toggle */}
                        <button 
                            onClick={() => setShowBalance(!showBalance)}
                            className="w-full py-2 flex items-center justify-center gap-2 text-xs text-white/50 hover:text-white transition-colors"
                        >
                            {showBalance ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            {showBalance ? 'Hide Balance' : 'Show Balance'}
                        </button>
                    </div>

                    {/* Quick Actions */}
                    <div className="px-6 mt-4">
                        <div className="grid grid-cols-4 gap-3">
                            {[
                                { icon: Send, label: 'Send', bg: 'bg-blue-500/20', iconColor: 'text-blue-400' },
                                { icon: Download, label: 'Request', bg: 'bg-green-500/20', iconColor: 'text-green-400' },
                                { icon: CreditCard, label: 'Cards', bg: 'bg-purple-500/20', iconColor: 'text-purple-400' },
                                { icon: ScanLine, label: 'Scan', bg: 'bg-orange-500/20', iconColor: 'text-orange-400' },
                            ].map((action, i) => (
                                <div key={i} className="flex flex-col items-center gap-2">
                                    <div className={`w-14 h-14 ${action.bg} rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/10`}>
                                        <action.icon className={`w-6 h-6 ${action.iconColor}`} />
                                    </div>
                                    <span className="text-xs font-medium text-white/70">{action.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Send Contacts */}
                    <div className="px-6 mt-6">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-sm font-bold text-white">Quick Send</h4>
                            <button className="text-xs text-orange-400 font-medium">View All</button>
                        </div>
                        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                            {[
                                { name: 'Sarah K.', flag: 'ZM', avatar: '👩🏾', color: 'from-pink-500 to-rose-500' },
                                { name: 'John D.', flag: 'US', avatar: '👨🏿', color: 'from-blue-500 to-cyan-500' },
                                { name: 'Mary W.', flag: 'KE', avatar: '👩🏽', color: 'from-green-500 to-emerald-500' },
                                { name: 'David L.', flag: 'NG', avatar: '👨🏾', color: 'from-orange-500 to-amber-500' },
                                { name: 'Add New', flag: null, avatar: null, color: null },
                            ].map((contact, i) => (
                                <button key={i} className="flex flex-col items-center gap-2 min-w-[72px]">
                                    {contact.avatar ? (
                                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${contact.color} flex items-center justify-center text-2xl shadow-lg border-2 border-white/10`}>
                                            {contact.avatar}
                                        </div>
                                    ) : (
                                        <div className="w-14 h-14 rounded-2xl bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center">
                                            <Plus className="w-6 h-6 text-white/40" />
                                        </div>
                                    )}
                                    <div className="flex flex-col items-center">
                                        {contact.flag && (
                                            <ReactCountryFlag 
                                                countryCode={contact.flag} 
                                                svg 
                                                style={{ width: '14px', height: '10px', borderRadius: '2px', marginBottom: '2px' }} 
                                            />
                                        )}
                                        <span className="text-[10px] font-medium text-white/70 text-center max-w-[70px] truncate">
                                            {contact.name}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Recent Transactions */}
                    <div className="px-6 mt-6 flex-1">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-sm font-bold text-white">Recent Activity</h4>
                            <button className="text-xs text-orange-400 font-medium">See All</button>
                        </div>
                        <div className="space-y-3">
                            {[
                                { name: 'Netflix Subscription', amount: '-$15.99', icon: '🎬', time: 'Today', color: 'bg-red-500/10', country: null },
                                { name: 'Received from Sarah K.', amount: '+$450.00', icon: null, time: 'Yesterday', color: 'bg-green-500/10', country: 'ZM', avatar: '👩🏾' },
                                { name: 'Lusaka Mall Purchase', amount: '-K89.50', icon: '🛍️', time: '2 days ago', color: 'bg-orange-500/10', country: 'ZM' },
                                { name: 'Payment to John D.', amount: '-$120.00', icon: null, time: '3 days ago', color: 'bg-blue-500/10', country: 'US', avatar: '👨🏿' },
                            ].map((tx, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                                    <div className="flex items-center gap-3">
                                        {tx.avatar ? (
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-lg shadow-lg">
                                                {tx.avatar}
                                            </div>
                                        ) : (
                                            <div className={`w-10 h-10 ${tx.color} rounded-xl flex items-center justify-center text-lg`}>
                                                {tx.icon}
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-xs font-semibold text-white">{tx.name}</p>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                {tx.country && (
                                                    <ReactCountryFlag 
                                                        countryCode={tx.country} 
                                                        svg 
                                                        style={{ width: '10px', height: '7px', borderRadius: '1px' }} 
                                                    />
                                                )}
                                                <p className="text-[9px] text-white/50">{tx.time}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <span className={`text-sm font-bold ${tx.amount.startsWith('+') ? 'text-green-400' : 'text-white'}`}>
                                        {tx.amount}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'cards',
            title: 'Virtual Cards',
            icon: CreditCard,
            gradient: 'from-purple-500 to-pink-500',
            content: (
                <div className="h-full flex flex-col">
                    <div className="px-6 pt-14 pb-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <h4 className="text-xl font-bold text-white">My Cards</h4>
                                <p className="text-xs text-white/60">Manage your virtual cards</p>
                            </div>
                            <button className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 hover:bg-white/20 transition-colors">
                                <Plus className="w-5 h-5 text-white" />
                            </button>
                        </div>
                    </div>

                    {/* Black Mastercard */}
                    <div className="px-6 mt-2">
                        <div className="relative h-56 bg-gradient-to-br from-gray-900/90 to-black/90 rounded-[28px] p-6 shadow-2xl border border-white/10 backdrop-blur-xl overflow-hidden">
                            {/* Subtle Pattern */}
                            <div className="absolute inset-0 opacity-5">
                                <div className="absolute inset-0" style={{
                                    backgroundImage: `repeating-linear-gradient(
                                        45deg,
                                        transparent,
                                        transparent 2px,
                                        #ffffff 2px,
                                        #ffffff 4px
                                    )`
                                }}></div>
                            </div>

                            {/* Decorative Glows */}
                            <div className="absolute -top-20 -right-20 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl"></div>
                            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-orange-500/5 rounded-full blur-3xl"></div>

                            <div className="relative z-10 h-full flex flex-col justify-between">
                                {/* Top Row */}
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                        <img src="/assets/images/flapapaylogoicon.png" className="w-8 h-8 object-contain" alt="FlapaPay" />
                                        <span className="text-white font-black tracking-tight text-lg">FlapaPay</span>
                                    </div>
                                    <img 
                                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1200px-Mastercard-logo.svg.png" 
                                        alt="Mastercard"
                                        className="w-12 h-auto opacity-90"
                                    />
                                </div>

                                {/* Card Number */}
                                <div className="mt-4">
                                    <p className="text-lg font-black tracking-[0.25em] text-white">4829 5201 8830 1928</p>
                                </div>

                                {/* Bottom Row - Expiry, CVV, Cardholder */}
                                <div className="flex justify-between items-end mt-auto">
                                    <div>
                                        <p className="text-[8px] font-black uppercase tracking-widest text-gray-500 mb-1">Card Holder</p>
                                        <p className="text-xs font-bold text-white uppercase tracking-wide">ALEX MWANGI</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <div>
                                            <p className="text-[8px] font-black uppercase tracking-widest text-gray-500 mb-1">Expiry</p>
                                            <p className="text-xs font-bold text-white uppercase">12/28</p>
                                        </div>
                                        <div>
                                            <p className="text-[8px] font-black uppercase tracking-widest text-gray-500 mb-1">CVV</p>
                                            <p className="text-xs font-bold text-white uppercase">***</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card Stats */}
                    <div className="px-6 mt-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/5 hover:bg-white/10 transition-colors">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp className="w-4 h-4 text-green-400" />
                                    <span className="text-xs text-white/60 font-medium">Monthly Limit</span>
                                </div>
                                <p className="text-xl font-black text-white">$5,000</p>
                                <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full w-3/5 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
                                </div>
                                <p className="text-[10px] text-white/40 mt-1">$3,240 used</p>
                            </div>
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/5 hover:bg-white/10 transition-colors">
                                <div className="flex items-center gap-2 mb-2">
                                    <Shield className="w-4 h-4 text-blue-400" />
                                    <span className="text-xs text-white/60 font-medium">Security</span>
                                </div>
                                <p className="text-xl font-black text-white">Enabled</p>
                                <div className="flex items-center gap-1.5 mt-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="text-[10px] text-green-400 font-medium">3D Secure Active</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Card Actions */}
                    <div className="px-6 mt-4 flex-1">
                        <h4 className="text-sm font-bold text-white mb-3">Card Controls</h4>
                        <div className="space-y-2">
                            {[
                                { label: 'Freeze Card', icon: Lock, color: 'text-orange-400', bg: 'bg-orange-500/10', desc: 'Temporarily lock your card' },
                                { label: 'Set Spending Limits', icon: BarChart3, color: 'text-purple-400', bg: 'bg-purple-500/10', desc: 'Daily & monthly limits' },
                                { label: 'Online Transactions', icon: Globe, color: 'text-blue-400', bg: 'bg-blue-500/10', desc: 'Enable/disable online payments', active: true },
                                { label: 'Card Settings', icon: MoreHorizontal, color: 'text-gray-400', bg: 'bg-gray-500/10', desc: 'PIN, notifications & more' },
                            ].map((action, i) => (
                                <div 
                                    key={i} 
                                    className={`flex items-center justify-between p-4 ${action.bg} rounded-2xl border border-white/5 cursor-pointer hover:bg-white/15 transition-all group`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${action.active !== undefined ? 'ring-2 ring-white/10' : ''}`}>
                                            <action.icon className={`w-5 h-5 ${action.color}`} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-white">{action.label}</span>
                                                {action.active !== undefined && (
                                                    <div className={`w-8 h-4 rounded-full ${action.active ? 'bg-green-500' : 'bg-gray-600'} relative transition-colors`}>
                                                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${action.active ? 'right-0.5' : 'left-0.5'}`}></div>
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-white/50">{action.desc}</p>
                                        </div>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-white/30 group-hover:text-white/60 transition-colors" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'analytics',
            title: 'Analytics',
            icon: BarChart3,
            gradient: 'from-blue-500 to-cyan-500',
            content: (
                <div className="h-full flex flex-col">
                    <div className="px-6 pt-14 pb-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <h4 className="text-xl font-bold text-white">Spending Analytics</h4>
                                <p className="text-xs text-white/60">Real-time data movements</p>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 rounded-full border border-green-500/20">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-[10px] font-bold text-green-400">LIVE</span>
                            </div>
                        </div>
                    </div>

                    {/* Period Selector */}
                    <div className="px-6 mt-2">
                        <div className="flex gap-2">
                            {['Day', 'Week', 'Month', 'Year'].map((period, i) => (
                                <button
                                    key={period}
                                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                        i === 2
                                            ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30'
                                            : 'bg-white/5 text-white/60 hover:bg-white/10'
                                    }`}
                                >
                                    {period}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Real-time Graph Card */}
                    <div className="px-6 mt-4 flex-1">
                        <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-3xl p-5 border border-white/10">
                            {/* Header Stats */}
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-[10px] text-white/60 font-medium uppercase tracking-wider">Total Spent</p>
                                    <h3 className="text-2xl font-black text-white">$3,847.20</h3>
                                </div>
                                <div className="text-right">
                                    <div className="px-3 py-1.5 bg-green-500/20 rounded-full border border-green-500/20 mb-1">
                                        <span className="text-[10px] font-bold text-green-400">+12.5%</span>
                                    </div>
                                    <p className="text-[9px] text-white/50">vs last month</p>
                                </div>
                            </div>

                            {/* Real-time Line Chart */}
                            <div className="relative h-40 mb-4">
                                <svg className="w-full h-full" viewBox="0 0 400 160" preserveAspectRatio="none">
                                    {/* Grid Lines */}
                                    <defs>
                                        <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                            <stop offset="0%" stopColor="#f97316" stopOpacity="0.4" />
                                            <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                                        </linearGradient>
                                        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#f97316" />
                                            <stop offset="50%" stopColor="#fbbf24" />
                                            <stop offset="100%" stopColor="#f97316" />
                                        </linearGradient>
                                    </defs>
                                    
                                    {/* Horizontal Grid */}
                                    {[0, 40, 80, 120, 160].map((y, i) => (
                                        <line
                                            key={i}
                                            x1="0"
                                            y1={y}
                                            x2="400"
                                            y2={y}
                                            stroke="rgba(255,255,255,0.05)"
                                            strokeWidth="1"
                                        />
                                    ))}

                                    {/* Area Fill */}
                                    <path
                                        d="M0,160 L0,120 Q30,100 60,110 T120,80 T180,90 T240,60 T300,70 T360,40 L400,30 L400,160 Z"
                                        fill="url(#chartGradient)"
                                        className="animate-pulse-area"
                                    />

                                    {/* Main Line */}
                                    <path
                                        d="M0,120 Q30,100 60,110 T120,80 T180,90 T240,60 T300,70 T360,40 L400,30"
                                        fill="none"
                                        stroke="url(#lineGradient)"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        className="animate-chart-line"
                                    />

                                    {/* Animated Data Points */}
                                    {[
                                        { x: 60, y: 110, value: '$245' },
                                        { x: 120, y: 80, value: '$380' },
                                        { x: 180, y: 90, value: '$320' },
                                        { x: 240, y: 60, value: '$520' },
                                        { x: 300, y: 70, value: '$450' },
                                        { x: 360, y: 40, value: '$680' },
                                        { x: 400, y: 30, value: '$740' },
                                    ].map((point, i) => (
                                        <g key={i}>
                                            <circle
                                                cx={point.x}
                                                cy={point.y}
                                                r="8"
                                                fill="#1a1a1a"
                                                stroke="#f97316"
                                                strokeWidth="2"
                                                className="animate-point-pulse"
                                                style={{ animationDelay: `${i * 0.2}s` }}
                                            />
                                            <circle
                                                cx={point.x}
                                                cy={point.y}
                                                r="4"
                                                fill="#fbbf24"
                                            />
                                        </g>
                                    ))}
                                </svg>

                                {/* Value Labels */}
                                <div className="absolute top-0 left-0 right-0 flex justify-between px-2 text-[8px] text-white/40 font-mono">
                                    <span>$0</span>
                                    <span>$500</span>
                                    <span>$1000</span>
                                </div>
                            </div>

                            {/* Time Labels */}
                            <div className="flex justify-between px-2 mb-4">
                                {['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', 'Now'].map((time, i) => (
                                    <span key={i} className="text-[9px] text-white/50 font-medium">{time}</span>
                                ))}
                            </div>

                            {/* Live Transaction Feed */}
                            <div className="border-t border-white/10 pt-4">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="text-sm font-bold text-white">Live Transactions</h4>
                                    <div className="flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-ping"></div>
                                        <span className="text-[10px] text-orange-400 font-medium">Real-time</span>
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    {[
                                        { merchant: 'Lusaka Store', amount: '-K 245.00', time: 'Just now', icon: '🛒', type: 'debit', country: 'ZM' },
                                        { merchant: 'Received from John', amount: '+$120.00', time: '2 min ago', icon: '👤', type: 'credit', country: 'US' },
                                        { merchant: 'Netflix', amount: '-$15.99', time: '5 min ago', icon: '🎬', type: 'debit', country: 'US' },
                                        { merchant: 'Nairobi Mall', amount: '-KSh 890', time: '12 min ago', icon: '🛍️', type: 'debit', country: 'KE' },
                                    ].map((tx, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-all animate-slide-in"
                                            style={{ animationDelay: `${i * 0.1}s` }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                                                    tx.type === 'credit' ? 'bg-green-500/20' : 'bg-orange-500/10'
                                                }`}>
                                                    {tx.icon}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-xs font-semibold text-white">{tx.merchant}</p>
                                                        <ReactCountryFlag
                                                            countryCode={tx.country}
                                                            svg
                                                            style={{ width: '10px', height: '7px', borderRadius: '1px' }}
                                                        />
                                                    </div>
                                                    <p className="text-[9px] text-white/50">{tx.time}</p>
                                                </div>
                                            </div>
                                            <span className={`text-sm font-bold ${
                                                tx.type === 'credit' ? 'text-green-400' : 'text-white'
                                            }`}>
                                                {tx.amount}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Wallet Breakdown */}
                    <div className="px-6 mt-4">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-sm font-bold text-white">By Wallet</h4>
                            <button className="text-xs text-orange-400 font-medium">See All</button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl p-4 border border-green-500/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <ReactCountryFlag countryCode="US" svg style={{ width: '14px', height: '10px', borderRadius: '2px' }} />
                                    <span className="text-xs text-white/70 font-medium">USD</span>
                                </div>
                                <p className="text-lg font-black text-white">$2,145.00</p>
                                <p className="text-[10px] text-green-400 mt-1">55% of total</p>
                            </div>
                            <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/10 rounded-2xl p-4 border border-orange-500/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <ReactCountryFlag countryCode="ZM" svg style={{ width: '14px', height: '10px', borderRadius: '2px' }} />
                                    <span className="text-xs text-white/70 font-medium">ZMW</span>
                                </div>
                                <p className="text-lg font-black text-white">K 45,230</p>
                                <p className="text-[10px] text-orange-400 mt-1">45% of total</p>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 'fx-swap',
            title: 'FX Swap',
            icon: Repeat,
            gradient: 'from-emerald-500 to-teal-500',
            content: (
                <div className="h-full flex flex-col">
                    <div className="px-6 pt-14 pb-4">
                        <div className="flex justify-between items-center">
                            <div>
                                <h4 className="text-xl font-bold text-white">FX Liquidity Pool</h4>
                                <p className="text-xs text-white/60">Swap currencies instantly</p>
                            </div>
                            <button className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 hover:bg-white/20 transition-colors">
                                <Settings className="w-5 h-5 text-white" />
                            </button>
                        </div>
                    </div>

                    {/* Pool Stats */}
                    <div className="px-6 mt-2">
                        <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-2xl p-4 border border-emerald-500/20">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-[10px] text-emerald-400 font-medium uppercase tracking-wider">Total Liquidity</p>
                                    <p className="text-xl font-black text-white">$12.4M</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-teal-400 font-medium uppercase tracking-wider">24h Volume</p>
                                    <p className="text-xl font-black text-white">$847K</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Swap Card */}
                    <div className="px-6 mt-4">
                        <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-3xl p-5 border border-white/10">
                            {/* From Currency */}
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] text-white/50 font-medium">From</span>
                                    <span className="text-[10px] text-white/50">Balance: $24,580.45</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
                                        <ReactCountryFlag countryCode="US" svg style={{ width: '18px', height: '13px', borderRadius: '3px' }} />
                                        <span className="text-sm font-bold text-white">USD</span>
                                        <ArrowDown className="w-4 h-4 text-white/60" />
                                    </button>
                                    <input 
                                        type="text" 
                                        value="1,000.00"
                                        readOnly
                                        className="flex-1 bg-transparent text-right text-2xl font-black text-white outline-none"
                                    />
                                </div>
                            </div>

                            {/* Swap Button */}
                            <div className="flex justify-center -my-3 relative z-10">
                                <button className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30 hover:scale-110 transition-transform border-4 border-[#1a1a1a]">
                                    <Repeat className="w-5 h-5 text-white" />
                                </button>
                            </div>

                            {/* To Currency */}
                            <div className="bg-white/5 rounded-2xl p-4 border border-white/5 mt-1">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-[10px] text-white/50 font-medium">To</span>
                                    <span className="text-[10px] text-white/50">Balance: K 648,234.50</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
                                        <ReactCountryFlag countryCode="ZM" svg style={{ width: '18px', height: '13px', borderRadius: '3px' }} />
                                        <span className="text-sm font-bold text-white">ZMW</span>
                                        <ArrowDown className="w-4 h-4 text-white/60" />
                                    </button>
                                    <input 
                                        type="text" 
                                        value="26,450.00"
                                        readOnly
                                        className="flex-1 bg-transparent text-right text-2xl font-black text-white outline-none"
                                    />
                                </div>
                            </div>

                            {/* Exchange Rate */}
                            <div className="mt-4 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <Info className="w-4 h-4 text-emerald-400" />
                                        <span className="text-xs text-emerald-400 font-medium">Exchange Rate</span>
                                    </div>
                                    <span className="text-sm font-black text-white">1 USD = 26.45 ZMW</span>
                                </div>
                            </div>

                            {/* Fee */}
                            <div className="mt-2 flex justify-between items-center px-1">
                                <span className="text-[10px] text-white/50">Network Fee</span>
                                <span className="text-[10px] font-bold text-white">$0.50</span>
                            </div>

                            {/* Swap Button */}
                            <button className="w-full mt-4 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl text-sm font-black text-white hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/30 active:scale-[0.98]">
                                Swap Now
                            </button>
                        </div>
                    </div>

                    {/* Popular Pairs */}
                    <div className="px-6 mt-4 flex-1">
                        <h4 className="text-sm font-bold text-white mb-3">Popular Pairs</h4>
                        <div className="space-y-2">
                            {[
                                { from: 'USD', to: 'ZMW', rate: '26.45', change: '+0.12%', fromFlag: 'US', toFlag: 'ZM', volume: '$234K' },
                                { from: 'USD', to: 'NGN', rate: '1,640.50', change: '-0.05%', fromFlag: 'US', toFlag: 'NG', volume: '$189K' },
                                { from: 'USD', to: 'KES', rate: '132.20', change: '+0.08%', fromFlag: 'US', toFlag: 'KE', volume: '$156K' },
                                { from: 'ZMW', to: 'USD', rate: '0.038', change: '-0.10%', fromFlag: 'ZM', toFlag: 'US', volume: '$98K' },
                            ].map((pair, i) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1">
                                            <ReactCountryFlag countryCode={pair.fromFlag} svg style={{ width: '16px', height: '11px', borderRadius: '2px' }} />
                                            <span className="text-sm font-bold text-white">{pair.from}</span>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-white/30" />
                                        <div className="flex items-center gap-1">
                                            <ReactCountryFlag countryCode={pair.toFlag} svg style={{ width: '16px', height: '11px', borderRadius: '2px' }} />
                                            <span className="text-sm font-bold text-white">{pair.to}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-white">{pair.rate}</p>
                                        <p className={`text-[10px] font-medium ${pair.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                                            {pair.change}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )
        }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setIsAnimating(true);
            setTimeout(() => {
                setActiveScreen(prev => (prev + 1) % appScreens.length);
                setIsAnimating(false);
            }, 500);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const features = [
        { icon: Shield, title: 'Bank-Grade Security', desc: 'AES-256 encryption & biometric auth', color: 'text-green-400', bg: 'bg-green-500/10' },
        { icon: Zap, title: 'Instant Transfers', desc: 'Send money in real-time across Africa', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
        { icon: Globe, title: 'Multi-Currency', desc: 'Hold & exchange 15+ African currencies', color: 'text-blue-400', bg: 'bg-blue-500/10' },
        { icon: Fingerprint, title: 'Biometric Login', desc: 'Secure access with fingerprint or face', color: 'text-purple-400', bg: 'bg-purple-500/10' },
    ];

    return (
        <section id="mobile-app" className="relative py-32 bg-[#020202] overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
                <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '60px 60px' }}></div>
            </div>

            <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
                {/* Header */}
                <div className="text-center max-w-4xl mx-auto mb-20">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold uppercase tracking-wider mb-6">
                        <Smartphone className="w-4 h-4" />
                        Mobile Banking Reimagined
                    </div>
                    <h2 className="text-5xl sm:text-7xl font-black text-white mb-8 leading-[1.1]">
                        Your Bank in <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500">Your Pocket</span>
                    </h2>
                    <p className="text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto">
                        Experience the most advanced mobile banking app in Africa. 
                        Send, receive, and manage your money with unparalleled ease and security.
                    </p>
                </div>

                {/* Phone Showcase */}
                <div className="relative flex justify-center items-center mb-24">
                    {/* Decorative Rings */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] border border-white/5 rounded-full"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] border border-white/5 rounded-full"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-white/10 rounded-full"></div>

                    {/* Main Phone Frame */}
                    <div className="relative">
                        {/* Phone Outer Frame */}
                        <div className="w-[360px] h-[740px] bg-[#1a1a1a] rounded-[64px] p-3 shadow-[0_0_0_2px_#333,0_50px_100px_-20px_rgba(0,0,0,0.8),0_0_100px_rgba(249,115,22,0.1)]">
                            {/* Inner Bezel */}
                            <div className="w-full h-full bg-black rounded-[56px] overflow-hidden relative">
                                {/* Dynamic Island */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-9 bg-black rounded-b-2xl z-30 flex items-center justify-center">
                                    <div className="w-16 h-1 bg-white/10 rounded-full"></div>
                                </div>

                                {/* Screen Content */}
                                <div className={`h-full transition-opacity duration-500 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
                                    {appScreens[activeScreen].content}
                                </div>

                                {/* Bottom Tab Bar */}
                                <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black via-black/95 to-transparent z-20">
                                    <div className="absolute bottom-4 left-4 right-4 h-14 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 flex items-center justify-around px-2">
                                        {[
                                            { icon: Wallet, label: 'Home', active: activeScreen === 0 },
                                            { icon: Repeat, label: 'Swap', active: activeScreen === 3 },
                                            { icon: CreditCard, label: 'Cards', active: activeScreen === 1 },
                                            { icon: BarChart3, label: 'Analytics', active: activeScreen === 2 },
                                        ].map((tab, i) => (
                                            <button
                                                key={i}
                                                onClick={() => {
                                                    if (tab.label === 'Home') setActiveScreen(0);
                                                    if (tab.label === 'Swap') setActiveScreen(3);
                                                    if (tab.label === 'Cards') setActiveScreen(1);
                                                    if (tab.label === 'Analytics') setActiveScreen(2);
                                                }}
                                                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                                                    tab.active ? 'text-white' : 'text-white/40 hover:text-white/60'
                                                }`}
                                            >
                                                <tab.icon className={`w-5 h-5 ${tab.active ? 'stroke-[2.5px]' : ''}`} />
                                                <span className="text-[9px] font-medium">{tab.label}</span>
                                                {tab.active && (
                                                    <div className="absolute -bottom-1 w-8 h-0.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"></div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Home Indicator */}
                                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full z-30"></div>
                            </div>
                        </div>

                        {/* Floating Elements */}
                        <div className="absolute -top-8 -right-16 animate-float" style={{ animationDelay: '0s' }}>
                            <div className="px-4 py-3 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                                        <CheckCircle2 className="w-5 h-5 text-green-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-white">Payment Sent</p>
                                        <p className="text-[10px] text-white/60">$450.00 to Sarah</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="absolute -bottom-8 -left-16 animate-float" style={{ animationDelay: '2s' }}>
                            <div className="px-4 py-3 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
                                        <TrendingUp className="w-5 h-5 text-orange-400" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-white">+24% This Month</p>
                                        <p className="text-[10px] text-white/60">Great saving!</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Screen Selector Dots */}
                    <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex gap-3">
                        {appScreens.map((screen, i) => (
                            <button
                                key={screen.id}
                                onClick={() => setActiveScreen(i)}
                                className={`group flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
                                    i === activeScreen 
                                        ? 'bg-white/10 border border-white/20' 
                                        : 'hover:bg-white/5 border border-transparent'
                                }`}
                            >
                                <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                    i === activeScreen 
                                        ? `bg-gradient-to-r ${screen.gradient} w-6` 
                                        : 'bg-white/30'
                                }`}></div>
                                {i === activeScreen && (
                                    <span className="text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                        {screen.title}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
                    {features.map((feature, i) => (
                        <div 
                            key={i}
                            className="group p-8 bg-white/5 rounded-[32px] border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all duration-500"
                        >
                            <div className={`w-14 h-14 ${feature.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                                <feature.icon className={`w-7 h-7 ${feature.color}`} />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
                            <p className="text-sm text-gray-400 leading-relaxed">{feature.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Download CTAs */}
                <div className="text-center">
                    <h3 className="text-3xl font-black text-white mb-8">Download the App Today</h3>
                    <div className="flex flex-wrap justify-center gap-6">
                        {/* App Store Button */}
                        <a
                            href="#"
                            className="group relative px-2 py-2 rounded-3xl bg-gradient-to-br from-white/20 to-white/5 hover:from-orange-500/50 hover:to-orange-600/50 transition-all duration-500 shadow-xl hover:shadow-orange-500/20"
                        >
                            <div className="flex items-center gap-4 px-8 py-4 bg-black rounded-[20px] transition-colors">
                                <svg className="w-10 h-10" viewBox="0 0 24 24" fill="white">
                                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-.8 1.94-.8s.04 1.62-1.43 2.64c-.87.6-1.96.56-1.96.56s-.09-1.57.55-2.4c.29-.38.61-.61.9-.8z"/>
                                </svg>
                                <div className="text-left">
                                    <p className="text-[10px] text-gray-400 font-medium">Download on the</p>
                                    <p className="text-lg font-black text-white">App Store</p>
                                </div>
                                <ArrowRight className="w-5 h-5 text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all" />
                            </div>
                        </a>

                        {/* Google Play Button */}
                        <a
                            href="#"
                            className="group relative px-2 py-2 rounded-3xl bg-gradient-to-br from-white/20 to-white/5 hover:from-green-500/50 hover:to-green-600/50 transition-all duration-500 shadow-xl hover:shadow-green-500/20"
                        >
                            <div className="flex items-center gap-4 px-8 py-4 bg-black rounded-[20px] transition-colors">
                                <img 
                                    src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" 
                                    alt="Google Play"
                                    className="h-10 w-auto"
                                />
                                <ArrowRight className="w-5 h-5 text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all" />
                            </div>
                        </a>
                    </div>

                    {/* QR Code Download */}
                    <div className="mt-16">
                        <p className="text-sm text-gray-500 mb-6">Or scan to download</p>
                        <div className="inline-flex p-4 bg-white rounded-3xl shadow-2xl">
                            <div className="w-40 h-40 bg-white rounded-2xl p-3 border-2 border-gray-100">
                                {/* Mock QR Code SVG */}
                                <svg viewBox="0 0 100 100" className="w-full h-full">
                                    {/* Top-left finder pattern */}
                                    <rect x="0" y="0" width="28" height="28" fill="#000" rx="4"/>
                                    <rect x="4" y="4" width="20" height="20" fill="#fff"/>
                                    <rect x="8" y="8" width="12" height="12" fill="#000"/>
                                    
                                    {/* Top-right finder pattern */}
                                    <rect x="72" y="0" width="28" height="28" fill="#000" rx="4"/>
                                    <rect x="76" y="4" width="20" height="20" fill="#fff"/>
                                    <rect x="80" y="8" width="12" height="12" fill="#000"/>
                                    
                                    {/* Bottom-left finder pattern */}
                                    <rect x="0" y="72" width="28" height="28" fill="#000" rx="4"/>
                                    <rect x="4" y="76" width="20" height="20" fill="#fff"/>
                                    <rect x="8" y="80" width="12" height="12" fill="#000"/>
                                    
                                    {/* Data modules (random pattern for mock QR) */}
                                    <rect x="32" y="4" width="4" height="4" fill="#000"/>
                                    <rect x="40" y="4" width="4" height="4" fill="#000"/>
                                    <rect x="48" y="4" width="4" height="4" fill="#000"/>
                                    <rect x="60" y="4" width="4" height="4" fill="#000"/>
                                    
                                    <rect x="32" y="12" width="4" height="4" fill="#000"/>
                                    <rect x="44" y="12" width="4" height="4" fill="#000"/>
                                    <rect x="52" y="12" width="4" height="4" fill="#000"/>
                                    <rect x="60" y="12" width="4" height="4" fill="#000"/>
                                    
                                    <rect x="36" y="20" width="4" height="4" fill="#000"/>
                                    <rect x="44" y="20" width="4" height="4" fill="#000"/>
                                    <rect x="56" y="20" width="4" height="4" fill="#000"/>
                                    <rect x="64" y="20" width="4" height="4" fill="#000"/>
                                    
                                    <rect x="4" y="32" width="4" height="4" fill="#000"/>
                                    <rect x="12" y="32" width="4" height="4" fill="#000"/>
                                    <rect x="20" y="32" width="4" height="4" fill="#000"/>
                                    <rect x="80" y="32" width="4" height="4" fill="#000"/>
                                    <rect x="88" y="32" width="4" height="4" fill="#000"/>
                                    
                                    <rect x="4" y="40" width="4" height="4" fill="#000"/>
                                    <rect x="16" y="40" width="4" height="4" fill="#000"/>
                                    <rect x="24" y="40" width="4" height="4" fill="#000"/>
                                    <rect x="80" y="40" width="4" height="4" fill="#000"/>
                                    <rect x="92" y="40" width="4" height="4" fill="#000"/>
                                    
                                    <rect x="8" y="48" width="4" height="4" fill="#000"/>
                                    <rect x="16" y="48" width="4" height="4" fill="#000"/>
                                    <rect x="24" y="48" width="4" height="4" fill="#000"/>
                                    <rect x="84" y="48" width="4" height="4" fill="#000"/>
                                    <rect x="92" y="48" width="4" height="4" fill="#000"/>
                                    
                                    <rect x="32" y="56" width="4" height="4" fill="#000"/>
                                    <rect x="40" y="56" width="4" height="4" fill="#000"/>
                                    <rect x="48" y="56" width="4" height="4" fill="#000"/>
                                    <rect x="56" y="56" width="4" height="4" fill="#000"/>
                                    <rect x="64" y="56" width="4" height="4" fill="#000"/>
                                    
                                    <rect x="36" y="64" width="4" height="4" fill="#000"/>
                                    <rect x="44" y="64" width="4" height="4" fill="#000"/>
                                    <rect x="52" y="64" width="4" height="4" fill="#000"/>
                                    <rect x="60" y="64" width="4" height="4" fill="#000"/>
                                    
                                    <rect x="32" y="72" width="4" height="4" fill="#000"/>
                                    <rect x="44" y="72" width="4" height="4" fill="#000"/>
                                    <rect x="56" y="72" width="4" height="4" fill="#000"/>
                                    <rect x="68" y="72" width="4" height="4" fill="#000"/>
                                    
                                    <rect x="36" y="80" width="4" height="4" fill="#000"/>
                                    <rect x="44" y="80" width="4" height="4" fill="#000"/>
                                    <rect x="52" y="80" width="4" height="4" fill="#000"/>
                                    <rect x="64" y="80" width="4" height="4" fill="#000"/>
                                    
                                    <rect x="32" y="88" width="4" height="4" fill="#000"/>
                                    <rect x="40" y="88" width="4" height="4" fill="#000"/>
                                    <rect x="52" y="88" width="4" height="4" fill="#000"/>
                                    <rect x="60" y="88" width="4" height="4" fill="#000"/>
                                    <rect x="68" y="88" width="4" height="4" fill="#000"/>
                                    
                                    {/* Center logo */}
                                    <rect x="42" y="42" width="16" height="16" fill="#fff"/>
                                    <circle cx="50" cy="50" r="6" fill="#f97316"/>
                                </svg>
                            </div>
                        </div>
                        <p className="text-xs text-gray-600 mt-4 font-medium">flapapay.com/download</p>
                    </div>
                </div>

                {/* Trust Indicators */}
                <div className="mt-24 pt-16 border-t border-white/5">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {[
                            { value: '2M+', label: 'Downloads' },
                            { value: '4.8★', label: 'App Store Rating' },
                            { value: '99.9%', label: 'Uptime' },
                            { value: '24/7', label: 'Support' },
                        ].map((stat, i) => (
                            <div key={i} className="text-center">
                                <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400 mb-2">
                                    {stat.value}
                                </p>
                                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    50% { transform: translateY(-15px) rotate(2deg); }
                }
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .animate-shimmer {
                    animation: shimmer 2s ease-in-out infinite;
                }
                @keyframes data-pulse {
                    0%, 100% {
                        opacity: 0.3;
                        transform: scaleY(0.5);
                    }
                    50% {
                        opacity: 1;
                        transform: scaleY(1.2);
                    }
                }
                .animate-data-pulse {
                    animation: data-pulse 2s ease-in-out infinite;
                }
                @keyframes flow-line {
                    0% {
                        stroke-dashoffset: 0;
                    }
                    100% {
                        stroke-dashoffset: -24;
                    }
                }
                .animate-flow-line {
                    animation: flow-line 1s linear infinite;
                }
                @keyframes chart-line {
                    0% {
                        stroke-dashoffset: 1000;
                        opacity: 0;
                    }
                    50% {
                        opacity: 1;
                    }
                    100% {
                        stroke-dashoffset: 0;
                        opacity: 1;
                    }
                }
                .animate-chart-line {
                    animation: chart-line 2s ease-out forwards;
                }
                @keyframes pulse-area {
                    0%, 100% {
                        opacity: 0.3;
                    }
                    50% {
                        opacity: 0.5;
                    }
                }
                .animate-pulse-area {
                    animation: pulse-area 3s ease-in-out infinite;
                }
                @keyframes point-pulse {
                    0%, 100% {
                        transform: scale(1);
                        opacity: 1;
                    }
                    50% {
                        transform: scale(1.3);
                        opacity: 0.8;
                    }
                }
                .animate-point-pulse {
                    animation: point-pulse 2s ease-in-out infinite;
                }
                @keyframes slide-in {
                    0% {
                        opacity: 0;
                        transform: translateX(-20px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                .animate-slide-in {
                    animation: slide-in 0.5s ease-out forwards;
                }
            `}</style>
        </section>
    );
};
