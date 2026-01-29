import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { MessageSquare, Send, CheckCircle, HelpCircle, X } from 'lucide-react';
import axios from '../lib/axios';
import Button from './ui/Button';
import Input from './ui/Input';
import toast from 'react-hot-toast';

const QueryForm = () => {
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [showForm, setShowForm] = useState(false);

    const { register, handleSubmit, formState: { errors }, reset } = useForm();

    const onSubmit = async (data) => {
        try {
            setLoading(true);

            await axios.post('/queries', {
                fullName: data.fullName,
                email: data.email,
                mobile: data.mobile,
                subject: data.subject,
                message: data.message
            });

            setSuccess(true);
            toast.success('Query submitted successfully! We will get back to you soon.');
            reset();

            // Reset success state and hide form after 5 seconds
            setTimeout(() => {
                setSuccess(false);
                setShowForm(false);
            }, 5000);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit query. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // If form is not shown, display the button
    if (!showForm) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
            >
                <button
                    onClick={() => setShowForm(true)}
                    className="group inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-mindSaga-500 to-gd-500 text-white font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300"
                >
                    <HelpCircle className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                    <span>Have a Question? Ask Us!</span>
                </button>
                <p className="text-sm text-[var(--color-text-muted)] mt-3">
                    Click here to submit your query and we'll get back to you soon
                </p>
            </motion.div>
        );
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="glass-card p-8 rounded-3xl border border-[var(--glass-border)]"
            >
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-mindSaga-500/10 flex items-center justify-center">
                            <MessageSquare className="w-6 h-6 text-mindSaga-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Have a Question?</h2>
                            <p className="text-sm text-[var(--color-text-muted)]">We're here to help! Send us your query.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowForm(false)}
                        className="w-10 h-10 rounded-lg hover:bg-[var(--color-bg-tertiary)] flex items-center justify-center transition-colors"
                    >
                        <X className="w-5 h-5 text-[var(--color-text-muted)]" />
                    </button>
                </div>

                {success ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-8"
                    >
                        <div className="w-20 h-20 rounded-full bg-status-available/10 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-12 h-12 text-status-available" />
                        </div>
                        <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">Query Submitted!</h3>
                        <p className="text-[var(--color-text-secondary)]">
                            Thank you for reaching out. Our team will get back to you shortly.
                        </p>
                    </motion.div>
                ) : (
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <Input
                                label="Full Name *"
                                placeholder="Enter your full name"
                                {...register('fullName', {
                                    required: 'Name is required',
                                    minLength: { value: 3, message: 'Name must be at least 3 characters' },
                                    pattern: {
                                        value: /^[A-Za-z\s.]+$/,
                                        message: 'Name should only contain letters and spaces'
                                    }
                                })}
                                error={errors.fullName?.message}
                            />

                            <Input
                                label="Email Address *"
                                type="email"
                                placeholder="your.email@example.com"
                                {...register('email', {
                                    required: 'Email is required',
                                    pattern: {
                                        value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i,
                                        message: 'Please enter a valid email address'
                                    }
                                })}
                                error={errors.email?.message}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <Input
                                label="Mobile Number *"
                                type="tel"
                                placeholder="10 digit number"
                                maxLength={10}
                                onInput={(e) => {
                                    e.target.value = e.target.value.replace(/[^0-9]/g, '');
                                }}
                                {...register('mobile', {
                                    required: 'Mobile number is required',
                                    pattern: {
                                        value: /^[6-9][0-9]{9}$/,
                                        message: 'Please enter a valid 10-digit Indian mobile number'
                                    },
                                    minLength: { value: 10, message: 'Mobile number must be 10 digits' },
                                    maxLength: { value: 10, message: 'Mobile number must be 10 digits' }
                                })}
                                error={errors.mobile?.message}
                            />

                            <Input
                                label="Subject *"
                                placeholder="Brief subject of your query"
                                {...register('subject', {
                                    required: 'Subject is required',
                                    minLength: { value: 5, message: 'Subject must be at least 5 characters' }
                                })}
                                error={errors.subject?.message}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                                Message *
                            </label>
                            <textarea
                                rows={5}
                                placeholder="Describe your query in detail..."
                                {...register('message', {
                                    required: 'Message is required',
                                    minLength: { value: 10, message: 'Message must be at least 10 characters' }
                                })}
                                className={`w-full px-4 py-3 rounded-xl bg-[var(--input-bg)] border ${errors.message ? 'border-status-busy' : 'border-[var(--input-border)]'
                                    } text-[var(--input-text)] placeholder-[var(--input-placeholder)] focus:border-mindSaga-500 focus:ring-1 focus:ring-mindSaga-500 transition-smooth resize-none`}
                            />
                            {errors.message && (
                                <p className="mt-1 text-sm text-status-busy">{errors.message.message}</p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full h-12 text-lg font-bold"
                            loading={loading}
                            disabled={loading}
                        >
                            <Send className="w-5 h-5" />
                            Submit Query
                        </Button>

                        <p className="text-xs text-center text-[var(--color-text-muted)]">
                            We typically respond within 24 hours. For urgent matters, please call our support line.
                        </p>
                    </form>
                )}
            </motion.div>
        </AnimatePresence>
    );
};

export default QueryForm;
