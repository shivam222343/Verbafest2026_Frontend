import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { signInWithPopup } from 'firebase/auth';
import { FcGoogle } from 'react-icons/fc';
import { MdEmail, MdLock, MdPerson, MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { auth, googleProvider } from '../../lib/firebase';
import axios from '../../lib/axios';
import useAuthStore from '../../store/authStore';
import useThemeStore from '../../store/themeStore';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import toast from 'react-hot-toast';

const AdminSignupPage = () => {
    const navigate = useNavigate();
    const { setAuth } = useAuthStore();
    const { theme } = useThemeStore();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const { register, handleSubmit, formState: { errors }, watch } = useForm();
    const password = watch('password');

    React.useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const handleGoogleSignUp = async () => {
        try {
            setLoading(true);
            setError('');

            const result = await signInWithPopup(auth, googleProvider);
            const firebaseToken = await result.user.getIdToken();

            const response = await axios.post('/auth/google-signup', {
                firebaseToken,
                role: 'admin'
            });

            const { user, token } = response.data.data;

            if (user.isApproved === false && user.role === 'admin') {
                toast.success('Account created! Your admin access is pending approval by another administrator.');
                setLoading(false);
                return;
            }

            setAuth(user, token, 'admin');
            navigate('/admin/complete-profile');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to sign up with Google');
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data) => {
        try {
            setLoading(true);
            setError('');

            const response = await axios.post('/auth/register', {
                name: data.name,
                email: data.email,
                password: data.password,
                role: 'admin'
            });

            const { user, token } = response.data.data;

            if (user.isApproved === false && user.role === 'admin') {
                toast.success('Account created successfully! Please wait for another administrator to approve your access.');
                setLoading(false);
                return;
            }

            setAuth(user, token, 'admin');
            navigate('/admin/complete-profile');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create account');
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
                        Create Admin Account
                    </h1>
                    <p className="text-[var(--color-text-secondary)]">
                        Sign up to manage events
                    </p>
                </div>

                <Card className="p-8">
                    {error && (
                        <div className="mb-6 p-4 rounded-lg bg-status-busy/10 border border-status-busy/20">
                            <p className="text-status-busy text-sm">{error}</p>
                        </div>
                    )}

                    <Button
                        variant="outline"
                        onClick={handleGoogleSignUp}
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
                                Or sign up with email
                            </span>
                        </div>
                    </div>

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
                                    className="text-[var(--color-text-muted)] hover:text-mindSaga-500 transition-colors"
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

                        <Input
                            label="Confirm Password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            icon={MdLock}
                            {...register('confirmPassword', {
                                required: 'Please confirm your password',
                                validate: value => value === password || 'Passwords do not match'
                            })}
                            error={errors.confirmPassword?.message}
                        />

                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full"
                            loading={loading}
                            disabled={loading}
                        >
                            Create Account
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-[var(--color-text-muted)]">
                            Already have an account?{' '}
                            <Link to="/admin/login" className="text-mindSaga-500 hover:text-mindSaga-400 font-medium">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </Card>
            </motion.div>
        </div>
    );
};

export default AdminSignupPage;
