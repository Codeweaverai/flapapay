import React, { useState } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Button } from '../components/ui/Button';

interface Contact {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatar: string;
    lastUsed: string;
}

export const ContactsPage: React.FC = () => {
    const [contacts] = useState<Contact[]>([
        {
            id: '1',
            name: 'John Doe',
            email: 'john@example.com',
            phone: '+2348012345678',
            avatar: 'JD',
            lastUsed: '2023-05-15'
        },
        {
            id: '2',
            name: 'Jane Smith',
            email: 'jane@example.com',
            phone: '+2348087654321',
            avatar: 'JS',
            lastUsed: '2023-05-14'
        },
        {
            id: '3',
            name: 'Michael Johnson',
            email: 'michael@example.com',
            phone: '+2349012345678',
            avatar: 'MJ',
            lastUsed: '2023-05-12'
        },
        {
            id: '4',
            name: 'Sarah Williams',
            email: 'sarah@example.com',
            phone: '+2347012345678',
            avatar: 'SW',
            lastUsed: '2023-05-10'
        }
    ]);

    const [searchTerm, setSearchTerm] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);

    const filteredContacts = contacts.filter(contact =>
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.phone.includes(searchTerm)
    );

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-[var(--color-bg-secondary)]">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-[var(--color-text-main)] mb-2">Contacts</h1>
                    <p className="text-[var(--color-text-muted)]">Manage your saved contacts for quick payments</p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="relative w-full md:w-64">
                                <input
                                    type="text"
                                    placeholder="Search contacts..."
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>

                            <Button
                                onClick={() => setShowAddForm(!showAddForm)}
                                className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white"
                            >
                                + Add Contact
                            </Button>
                        </div>
                    </div>

                    {showAddForm && (
                        <div className="p-6 border-b border-gray-100 bg-gray-50">
                            <h3 className="text-lg font-medium text-[var(--color-text-main)] mb-4">Add New Contact</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-text-main)] mb-1">Name</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
                                        placeholder="Full name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-text-main)] mb-1">Email</label>
                                    <input
                                        type="email"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
                                        placeholder="Email address"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[var(--color-text-main)] mb-1">Phone</label>
                                    <input
                                        type="tel"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
                                        placeholder="Phone number"
                                    />
                                </div>
                                <div className="flex items-end">
                                    <Button className="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white">
                                        Save Contact
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="divide-y divide-gray-200">
                        {filteredContacts.length > 0 ? (
                            filteredContacts.map((contact) => (
                                <div key={contact.id} className="p-6 hover:bg-gray-50">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary)] font-bold mr-4">
                                            {contact.avatar}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-[var(--color-text-main)] truncate">{contact.name}</p>
                                            <p className="text-sm text-[var(--color-text-muted)] truncate">{contact.email}</p>
                                            <p className="text-sm text-[var(--color-text-muted)]">{contact.phone}</p>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <p className="text-sm text-[var(--color-text-muted)]">Last used: {formatDate(contact.lastUsed)}</p>
                                            <div className="mt-2 flex space-x-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-[var(--color-primary)] border-[var(--color-primary)]"
                                                >
                                                    Send Money
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                >
                                                    Edit
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-12 text-center">
                                <p className="text-[var(--color-text-muted)]">No contacts found</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};