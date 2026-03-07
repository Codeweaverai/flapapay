import React from 'react';

const stats = [
    { id: 1, name: 'Transactions', value: '$50M+' },
    { id: 2, name: 'Uptime', value: '99.99%' },
    { id: 3, name: 'Countries', value: '25+' },
    { id: 4, name: 'Developers', value: '10k+' },
];

export const Stats: React.FC = () => {
    return (
        <div className="bg-white pt-10 pb-20">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
                <div className="grid grid-cols-2 gap-8 md:grid-cols-4 border-t border-gray-100 pt-10">
                    {stats.map((stat) => (
                        <div key={stat.id} className="flex flex-col gap-y-2 border-l border-gray-100 pl-6">
                            <dt className="text-xs font-semibold leading-6 text-[var(--color-text-muted)] uppercase tracking-wide">{stat.name}</dt>
                            <dd className="order-first text-3xl font-bold tracking-tight text-[var(--color-text-main)]">
                                {stat.value}
                            </dd>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
