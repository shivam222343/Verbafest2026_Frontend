import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { signInWithPopup } from 'firebase/auth';
import { FcGoogle } from 'react-icons/fc';
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { auth, googleProvider } from '../../lib/firebase';
import axios from '../../lib/axios';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import toast from 'react-hot-toast';

const ParticipantLoginPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user, setAuth } = useAuthStore();
    const { theme } = useThemeStore();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm();

    // Redirect if already authenticated as participant
    const { userRole } = useAuthStore();
    React.useEffect(() => {
        if (isAuthenticated && userRole === 'participant') {
            if (user?.profileComplete === false) {
                navigate('/participant/complete-profile');
            } else {
                navigate('/participant/dashboard');
            }
        }
    }, [isAuthenticated, userRole, navigate, user]);

    React.useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const handleGoogleSignIn = async () => {
        try {
            setLoading(true);

            const result = await signInWithPopup(auth, googleProvider);
            const firebaseToken = await result.user.getIdToken();

            const response = await axios.post('/auth/google-login', {
                firebaseToken,
                role: 'participant'
            });

            if (response.data.data.isNewUser || response.data.data.user.profileComplete === false) {
                // For new participants or incomplete profiles, redirect to completion
                setAuth(response.data.data.user, response.data.data.token, 'participant');
                navigate('/participant/complete-profile');
            } else {
                setAuth(response.data.data.user, response.data.data.token, 'participant');
                navigate('/participant/dashboard');
            }
            toast.success('Signed in successfully!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to sign in with Google');
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data) => {
        try {
            setLoading(true);

            const response = await axios.post('/auth/login', {
                email: data.email,
                password: data.password,
                role: 'participant'
            });

            setAuth(response.data.data.user, response.data.data.token, 'participant');

            if (response.data.data.user.profileComplete === false) {
                navigate('/participant/complete-profile');
            } else {
                navigate('/participant/dashboard');
            }
            toast.success('Signed in successfully!');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center p-4 transition-colors duration-300">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white border border-[var(--glass-border)] shadow-2xl p-2 mb-4 overflow-hidden">
                        <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">
                        Participant Login
                    </h1>
                    <p className="text-[var(--color-text-secondary)]">
                        Sign in to view your events and status
                    </p>
                </div>

                <Card className="p-8">
                    <Button
                        variant="outline"
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                        className="w-full mb-6 border-2"
                    >
                        <FcGoogle className="w-5 h-5" />
                        Continue with Google
                    </Button>

                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-[var(--glass-border)]"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-[var(--color-bg-primary)] text-[var(--color-text-muted)]">
                                Or continue with email
                            </span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <Input
                            label="Email Address"
                            type="email"
                            placeholder="participant@example.com"
                            icon={MdEmail}
                            {...register('email', {
                                required: 'Email is required',
                                pattern: {
                                    value: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                                    message: 'Invalid email address'
                                }
                            })}
                            error={errors.email?.message}
                        />

                        <Input
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            icon={MdLock}
                            rightElement={
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="text-[var(--color-text-muted)] hover:text-gd-600 transition-colors"
                                >
                                    {showPassword ? <MdVisibilityOff className="w-5 h-5" /> : <MdVisibility className="w-5 h-5" />}
                                </button>
                            }
                            {...register('password', {
                                required: 'Password is required',
                                minLength: {
                                    value: 6,
                                    message: 'Password must be at least 6 characters'
                                }
                            })}
                            error={errors.password?.message}
                        />

                        <Button
                            type="submit"
                            variant="secondary"
                            className="w-full"
                            loading={loading}
                            disabled={loading}
                        >
                            Sign In
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-[var(--color-text-muted)]">
                            Enter the credentials received during event registration.
                        </p>
                    </div>
                </Card>

                <p className="text-center text-sm text-[var(--color-text-muted)] mt-6">

                </p>
            </motion.div>
        </div>
    );
};

export default ParticipantLoginPage;
