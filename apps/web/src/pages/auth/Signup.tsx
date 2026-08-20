import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/axios';
import { Button } from '../../components/ui/Button';
import { Navbar } from '../../components/layout/Navbar';

export const Signup: React.FC = () => {
    const { register, handleSubmit } = useForm();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const [success, setSuccess] = React.useState('');

    const onSubmit = async (data: any) => {
        setIsLoading(true);
        setError('');
        try {
            await api.post('/auth/register', data);
            setSuccess('Registration successful! You can now log in.');
            setTimeout(() => {
                navigate('/signup/individual');
            }, 1500);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen" style={{ background: 'var(--color-bg-main)' }}>
            <Navbar />
            <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                    <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-[var(--color-text-light)]">
                        Create your account
                    </h2>
                </div>

                <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm bg-white/90 backdrop-blur-sm rounded-xl shadow-2xl p-8">
                    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
                        {error && <div className="text-red-500 text-sm text-center bg-red-50 py-2 rounded-md border border-red-100">{error}</div>}
                        {success && <div className="text-green-600 text-sm font-medium text-center bg-green-50 py-2 rounded-md border border-green-100">{success}</div>}

                        <div>
                            <label className="block text-sm font-medium leading-6 text-[var(--color-text-main)]">Full Name</label>
                            <div className="mt-2">
                                <input
                                    {...register('fullName', { required: true })}
                                    type="text"
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[var(--color-primary)] sm:text-sm sm:leading-6 px-3"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium leading-6 text-[var(--color-text-main)]">Email address</label>
                            <div className="mt-2">
                                <input
                                    {...register('email', { required: true })}
                                    type="email"
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[var(--color-primary)] sm:text-sm sm:leading-6 px-3"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium leading-6 text-[var(--color-text-main)]">Password</label>
                            <div className="mt-2">
                                <input
                                    {...register('password', { required: true })}
                                    type="password"
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[var(--color-primary)] sm:text-sm sm:leading-6 px-3"
                                />
                            </div>
                        </div>

                        <div>
                            <Button type="submit" className="w-full" isLoading={isLoading}>Sign up</Button>
                        </div>

                        <div className="text-center text-sm text-[var(--color-text-main)]">
                            Already have an account?{' '}
                            <a href="/signup/individual" className="font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-dark)]">
                                Sign in
                            </a>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
