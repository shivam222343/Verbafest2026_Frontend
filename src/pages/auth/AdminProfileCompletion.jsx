import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { MdPerson, MdPhone, MdSchool, MdLocationOn } from 'react-icons/md';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import useAuthStore from '../../store/authStore';
import axios from '../../lib/axios';

const AdminProfileCompletion = () => {
    const navigate = useNavigate();
    const { user, setAuth } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: {
            name: user?.name || '',
            email: user?.email || ''
        }
    });

    const onSubmit = async (data) => {
        try {
            setLoading(true);
            setError('');

            const response = await axios.put('/auth/complete-profile', {
                ...data,
                role: 'admin'
            });

            setAuth(response.data.data.user, response.data.data.token, 'admin');
            navigate('/admin/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update profile');
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
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-mindSaga-600 mb-4">
                            <MdPerson className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">
                            Complete Your Profile
                        </h1>
                        <p className="text-[var(--color-text-secondary)]">
                            Please provide additional information to complete your admin account
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
                            {...register('name', { required: 'Name is required' })}
                            error={errors.name?.message}
                        />

                        <Input
                            label="Email Address"
                            type="email"
                            placeholder="admin@example.com"
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
                            label="Organization/Institution"
                            placeholder="Your University/Organization"
                            icon={MdSchool}
                            {...register('organization', { required: 'Organization is required' })}
                            error={errors.organization?.message}
                        />

                        <Input
                            label="Department/Role"
                            placeholder="Event Coordinator"
                            icon={MdLocationOn}
                            {...register('department', { required: 'Department/Role is required' })}
                            error={errors.department?.message}
                        />

                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full"
                            loading={loading}
                            disabled={loading}
                        >
                            Complete Profile
                        </Button>
                    </form>
                </Card>
            </motion.div>
        </div>
    );
};

export default AdminProfileCompletion;
