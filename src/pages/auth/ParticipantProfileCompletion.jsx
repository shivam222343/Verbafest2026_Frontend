import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { MdPerson, MdPhone, MdSchool } from 'react-icons/md';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import useAuthStore from '../../store/authStore';
import axios from '../../lib/axios';

const ParticipantProfileCompletion = () => {
    const navigate = useNavigate();
    const { user, setAuth } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: {
            fullName: user?.name || '',
            email: user?.email || ''
        }
    });

    const onSubmit = async (data) => {
        try {
            setLoading(true);
            setError('');

            const response = await axios.put('/auth/complete-profile', {
                ...data,
                role: 'participant'
            });

            setAuth(response.data.data.user, response.data.data.token, 'participant');
            navigate('/participant/dashboard');
        } catch (err) {
            setError('Failed to save profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-2xl"
            >
                <Card className="p-8">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gd-600 mb-4">
                            <MdPerson className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">
                            Complete Your Profile
                        </h1>
                        <p className="text-[var(--color-text-secondary)]">
                            This information will be used when you register for events
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 rounded-lg bg-status-busy/10 border border-status-busy/20">
                            <p className="text-status-busy text-sm">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <Input
                            label="Full Name"
                            placeholder="John Doe"
                            icon={MdPerson}
                            {...register('fullName', { required: 'Name is required' })}
                            error={errors.fullName?.message}
                        />

                        <Input
                            label="Email Address"
                            type="email"
                            placeholder="participant@example.com"
                            disabled
                            {...register('email')}
                        />

                        <Input
                            label="Phone Number"
                            type="tel"
                            placeholder="+1 234 567 8900"
                            icon={MdPhone}
                            {...register('phone', {
                                required: 'Phone number is required',
                                pattern: {
                                    value: /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/,
                                    message: 'Invalid phone number'
                                }
                            })}
                            error={errors.phone?.message}
                        />

                        <Input
                            label="College/University"
                            placeholder="Your Institution Name"
                            icon={MdSchool}
                            {...register('college', { required: 'College/University is required' })}
                            error={errors.college?.message}
                        />

                        <div className="bg-[var(--color-bg-tertiary)] p-4 rounded-lg border border-[var(--glass-border)]">
                            <p className="text-sm text-[var(--color-text-secondary)]">
                                <strong className="text-[var(--color-text-primary)]">Note:</strong> Additional details like year, department, and event preferences will be collected when you register for specific events.
                            </p>
                        </div>

                        <Button
                            type="submit"
                            variant="secondary"
                            className="w-full"
                            loading={loading}
                            disabled={loading}
                        >
                            Continue to Dashboard
                        </Button>
                    </form>
                </Card>
            </motion.div>
        </div>
    );
};

export default ParticipantProfileCompletion;
