export const MobileAppSection: React.FC = () => {

    return (
        <section id="mobile-app" className="py-24 bg-gray-50 overflow-hidden relative">
            <div className="mx-auto max-w-7xl px-6 lg:px-8 relative">
                <div className="bg-gradient-to-br from-black to-gray-900 rounded-[64px] overflow-hidden p-12 lg:p-24 relative shadow-2xl">
                    {/* Background Glow */}
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-orange-500 rounded-full blur-[140px] opacity-20"></div>
                    <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-yellow-400 rounded-full blur-[140px] opacity-10"></div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
                        {/* Left: Content */}
                        <div className="max-w-xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-orange-400 text-xs font-bold uppercase tracking-wider mb-8">
                                <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></span>
                                New App Experience
                            </div>
                            <h2 className="text-5xl font-black text-white sm:text-7xl mb-8 leading-[1.1]">
                                Money at your <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-yellow-400 to-orange-500">fingertips.</span>
                            </h2>
                            <p className="text-xl text-gray-400 mb-12 leading-relaxed">
                                Experience the future of African fintech. Track your ZMW and USD wallets, send money instantly, and manage your virtual cards on the go with our world-class mobile app.
                            </p>

                            <div className="flex flex-wrap gap-4 mb-16">
                                <button
                                    onClick={() => alert('App Store version coming soon!')}
                                    className="group relative px-1 py-1 rounded-2xl bg-gradient-to-br from-white/20 to-white/5 hover:from-orange-500/50 hover:to-orange-600/50 transition-all duration-500"
                                >
                                    <div className="flex items-center gap-3 px-6 py-3 bg-black rounded-[14px] transition-colors">
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/3/31/Apple_logo_white.svg" className="w-6 h-6" alt="Apple" />
                                        <div className="text-left">
                                            <p className="text-[10px] text-gray-400 font-bold uppercase leading-none mb-1">Download on the</p>
                                            <p className="text-sm font-black text-white">App Store</p>
                                        </div>
                                    </div>
                                </button>
                                <button
                                    onClick={() => alert('Play Store version coming soon!')}
                                    className="group relative px-1 py-1 rounded-2xl bg-gradient-to-br from-white/20 to-white/5 hover:from-yellow-500/50 hover:to-yellow-600/50 transition-all duration-500"
                                >
                                    <div className="flex items-center gap-3 px-6 py-4 bg-black rounded-[14px] transition-colors overflow-hidden">
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" className="h-10" alt="Google Play" />
                                    </div>
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-10 border-t border-white/10 pt-10">
                                <div className="flex gap-4">
                                    <div className="text-3xl">✨</div>
                                    <div>
                                        <p className="text-2xl font-black text-white">100%</p>
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Secure Assets</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="text-3xl">⚡</div>
                                    <div>
                                        <p className="text-2xl font-black text-white">Instant</p>
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Withdrawals</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right: Phone Mockups */}
                        <div className="relative flex justify-center lg:justify-end">
                            {/* Decorative Blur */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-500/20 rounded-full blur-[100px] z-0"></div>

                            {/* Main Phone */}
                            <div className="w-[320px] h-[640px] bg-[#0A0A0A] rounded-[64px] p-5 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border-[12px] border-[#1A1A1A] overflow-hidden relative z-10 transition-transform duration-700 hover:scale-105">
                                {/* Dynamic Island */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-8 bg-black rounded-b-3xl z-20 flex items-center justify-center">
                                    <div className="w-12 h-1 bg-white/20 rounded-full"></div>
                                </div>

                                <div className="h-full bg-black flex flex-col pt-12 text-white">
                                    {/* App Header */}
                                    <div className="px-6 mb-8 flex justify-between items-center">
                                        <img src="/assets/images/flapapaylogoicon.png" className="w-8 h-8" alt="Logo" />
                                        <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center text-xl">👤</div>
                                    </div>

                                    {/* Multi-Currency Card */}
                                    <div className="px-6 mb-8">
                                        <div className="bg-gradient-to-br from-orange-500 to-orange-700 rounded-3xl p-6 relative overflow-hidden group">
                                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-orange-200/60 mb-1">ZMW Wallet</p>
                                            <h3 className="text-4xl font-black text-white mb-6">K 45,230</h3>
                                            <div className="flex gap-2">
                                                <button className="flex-1 py-3 bg-white/20 rounded-xl text-xs font-black text-white">Withdraw</button>
                                                <button className="flex-1 py-3 bg-white rounded-xl text-xs font-black text-orange-600">Request</button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Recent Activity */}
                                    <div className="flex-1 bg-white rounded-t-[40px] p-8 space-y-6">
                                        <div className="flex justify-between items-center mb-2">
                                            <p className="text-xs font-black text-gray-900 uppercase tracking-wider">Activity</p>
                                            <button className="text-[10px] font-bold text-orange-600 uppercase">View All</button>
                                        </div>

                                        {[
                                            { name: 'Lusaka Store', amount: '- K450.00', icon: '🛒', color: 'bg-orange-50' },
                                            { name: 'Transfer from Sarah', amount: '+ K1,200.00', icon: '👤', color: 'bg-yellow-50' },
                                            { name: 'Subscription', amount: '- $15.99', icon: '📺', color: 'bg-gray-100' }
                                        ].map((item, i) => (
                                            <div key={i} className="flex justify-between items-center">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 ${item.color} rounded-2xl flex items-center justify-center text-xl shadow-sm text-gray-900`}>
                                                        {item.icon}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-gray-900">{item.name}</p>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase">Today, 12:45 PM</p>
                                                    </div>
                                                </div>
                                                <p className="text-sm font-black text-gray-900">{item.amount}</p>
                                            </div>
                                        ))}

                                        {/* Tab Bar Mockup */}
                                        <div className="mt-8 bg-black/90 backdrop-blur-md rounded-2xl p-3 flex justify-between px-6 shadow-xl relative z-20">
                                            {['🏠', '📊', '💳', '⚙️'].map((icon, i) => (
                                                <span key={i} className="text-lg opacity-80 hover:opacity-100 cursor-pointer">{icon}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
