import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import {
    Upload, CheckCircle, AlertCircle, Loader,
    User, CreditCard, Sparkles, ChevronRight,
    ChevronLeft, Mail, Phone, School, BookOpen,
    Download
} from 'lucide-react';
import axios from '../../lib/axios';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';
import toast from 'react-hot-toast';

import { useNavigate } from 'react-router-dom';

const RegistrationForm = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1);
    const [subEvents, setSubEvents] = useState([]);
    const [settings, setSettings] = useState(null);
    const [selectedEvents, setSelectedEvents] = useState([]);
    const [paymentProof, setPaymentProof] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [registrationData, setRegistrationData] = useState(null);
    const [registrationId, setRegistrationId] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadedUrl, setUploadedUrl] = useState('');
    const [paymentSettings, setPaymentSettings] = useState(null);
    const [calculation, setCalculation] = useState({
        subtotal: 0,
        discount: 0,
        total: 0
    });

    const { register, handleSubmit, formState: { errors }, reset, trigger, watch, setValue } = useForm({
        defaultValues: {
            year: 'First Year',
            college: "Kit's college of enginnering, Kolhapur",
            branch: "Computer Science and Engineering"
        }
    });

    const formData = watch();
    const showOtherYear = formData.year === 'Other';
    const showOtherCollege = formData.college === 'Other';
    const showOtherStream = formData.branch === 'Other';

    // Calculate total price based on selected events and apply discounts
    useEffect(() => {
        if (!subEvents.length || !paymentSettings) return;

        let subtotal = 0;
        const isAllSelected = selectedEvents.length === subEvents.length && subEvents.length > 0;

        if (isAllSelected && settings?.comboPrice) {
            subtotal = settings.comboPrice;
        } else {
            subtotal = selectedEvents.reduce((total, eventId) => {
                const event = subEvents.find(e => e._id === eventId);
                return total + (event?.registrationPrice || 50);
            }, 0);
        }

        let discount = 0;
        const discountSettings = paymentSettings.bulkDiscount;

        // Apply bulk discount only if NOT using comboPrice (or if intentional)
        // Usually comboPrice is already discounted, so we only apply bulk discount on individual selections
        if (!isAllSelected && discountSettings?.enabled && selectedEvents.length >= discountSettings.minEvents) {
            if (discountSettings.discountType === 'percentage') {
                discount = (subtotal * discountSettings.discountValue) / 100;
            } else {
                discount = discountSettings.discountValue;
            }
        }

        const total = Math.max(0, subtotal - discount);

        setCalculation({
            subtotal,
            discount,
            total
        });

        setValue('paidAmount', total);
    }, [selectedEvents, subEvents, paymentSettings, settings, setValue]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [formRes, settingsRes, paymentRes] = await Promise.all([
                    axios.get('/registration/form'),
                    axios.get('/registration/settings'),
                    axios.get('/payment-settings')
                ]);
                setSubEvents(formRes.data.data);
                setSettings(settingsRes.data.data);
                setPaymentSettings(paymentRes.data.data);

                if (settingsRes.data.data.availableColleges?.length > 0) {
                    setValue('college', settingsRes.data.data.availableColleges[0]);
                }
                if (settingsRes.data.data.availableStreams?.length > 0) {
                    setValue('branch', settingsRes.data.data.availableStreams[0]);
                }
            } catch (err) {
                console.error('Error fetching data:', err);
                toast.error('Failed to load form settings');
            }
        };
        fetchData();
    }, [setValue]);



    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('File size must be less than 5MB');
                return;
            }
            if (!file.type.startsWith('image/')) {
                toast.error('Only image files are allowed');
                return;
            }

            setPaymentProof(file);
            setIsUploading(true);

            try {
                const uploadData = new FormData();
                uploadData.append('paymentProof', file);
                const response = await axios.post('/registration/upload-proof', uploadData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                setUploadedUrl(response.data.url);
                toast.success('Screenshot uploaded successfully!');
            } catch (err) {
                toast.error('Failed to upload image. Please try again.');
                setPaymentProof(null);
            } finally {
                setIsUploading(false);
            }
        }
    };

    const handleDownloadQR = async () => {
        if (!paymentSettings?.upiId) return;

        const isCombo = selectedEvents.length > 1;
        const uploadedQr = isCombo ? settings?.allEventsQrCodeUrl : settings?.singleEventQrCodeUrl;

        const dynamicQr = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(
            `upi://pay?pa=${paymentSettings.upiId}&pn=${paymentSettings.accountName}&am=${calculation.total}&cu=INR`
        )}`;

        const finalQrUrl = uploadedQr || dynamicQr;

        try {
            const response = await fetch(finalQrUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `payment-qr-${isCombo ? 'combo' : 'single'}-₹${calculation.total}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            toast.error('Failed to download QR code');
        }
    };

    const nextStep = async () => {
        const result = await trigger(['fullName', 'email', 'mobile', 'prn', 'college', 'otherCollege', 'branch', 'otherStream', 'year', 'otherYear']);
        if (result) {
            if (selectedEvents.length === 0) {
                toast.error('Please select at least one sub-event');
                return;
            }
            setCurrentStep(2);
            window.scrollTo(0, 0);
        } else {
            toast.error('Please fill in all required fields correctly');
        }
    };

    const prevStep = () => {
        setCurrentStep(1);
        window.scrollTo(0, 0);
        toast('Editing registration details...', { icon: '📝' });
    };

    const onSubmit = async (data) => {
        if (!paymentProof || !uploadedUrl) {
            toast.error('Please upload payment proof screenshot');
            return;
        }

        setLoading(true);

        try {
            const submitData = new FormData();
            submitData.append('fullName', data.fullName);
            submitData.append('email', data.email);
            submitData.append('mobile', data.mobile);
            submitData.append('prn', data.prn);
            submitData.append('paidAmount', data.paidAmount);

            // Handle "Other" logic for data submission
            const finalCollege = data.college === 'Other' ? data.otherCollege : data.college;
            const finalBranch = data.branch === 'Other' ? data.otherStream : data.branch;

            // Map Year string to Number for backend if possible, or just send string
            const yearMap = { 'First Year': 1, 'Second Year': 2, 'Third Year': 3, 'Last Year': 4, 'Other': 5 };
            const finalYear = data.year === 'Other' ? (data.otherYear || 5) : (yearMap[data.year] || 1);

            submitData.append('branch', finalBranch);
            submitData.append('year', finalYear);
            submitData.append('college', finalCollege);
            submitData.append('transactionId', data.transactionId);
            submitData.append('selectedSubEvents', JSON.stringify(selectedEvents));
            submitData.append('paymentProofUrl', uploadedUrl);

            const response = await axios.post('/registration/submit', submitData);

            setSuccess(true);
            setRegistrationId(response.data.data.participant.id);
            setRegistrationData(response.data.data.participant);
            toast.success('Registration submitted successfully!');
            reset();
            setSelectedEvents([]);
            setPaymentProof(null);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (settings && settings.isRegistrationOpen === false) {
        return (
            <div className="max-w-2xl mx-auto py-12">
                <Card className="text-center p-12">
                    <AlertCircle className="w-20 h-20 text-status-busy mx-auto mb-6" />
                    <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-4">Registration Closed</h2>
                    <p className="text-[var(--color-text-secondary)] mb-6">We are sorry, but registrations for {settings.eventName} are currently closed.</p>
                    <p className="text-sm text-[var(--color-text-muted)]">Please contact {settings.contactEmail} for more information.</p>
                </Card>
            </div>
        );
    }

    if (success) {
        return (
            <div className="max-w-2xl mx-auto py-12">
                <Card className="text-center p-12">
                    <div className="w-24 h-24 mx-auto mb-6 rounded-2xl overflow-hidden shadow-xl border border-[var(--glass-border)] bg-white p-2">
                        <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <CheckCircle className="w-12 h-12 text-status-available mx-auto mb-4" />
                    <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-4">Registration Submitted!</h2>
                    <p className="text-[var(--color-text-secondary)] mb-6">Your registration has been submitted successfully. Please wait for admin approval.</p>

                    <div className="space-y-4 mb-8">
                        <div className="glass-card p-4 bg-mindSaga-500/5 rounded-2xl border border-mindSaga-500/20">
                            <p className="text-[10px] text-[var(--color-text-muted)] mb-1 uppercase tracking-wider font-bold">Registration ID</p>
                            <p className="text-xl font-mono text-mindSaga-400 font-bold break-all">{registrationId}</p>
                        </div>

                        <div className="glass-card p-6 bg-gd-500/5 rounded-3xl border border-gd-500/20 text-left">
                            <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-gd-500" />
                                Your Login Credentials
                            </h3>
                            <div className="space-y-3">
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-[var(--color-text-muted)] uppercase font-bold">Email</span>
                                    <span className="text-[var(--color-text-primary)] font-medium">{registrationData?.email}</span>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-[var(--color-text-muted)] uppercase font-bold">Password</span>
                                    <span className="text-lg font-mono text-gd-500 font-bold">{registrationData?.password}</span>
                                </div>
                                <p className="text-[10px] text-status-busy mt-2 font-medium">⚠️ Please save these credentials. You will need them to login to your dashboard.</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button
                            variant="primary"
                            className="w-full h-12"
                            onClick={() => window.location.href = '/participant/login'}
                        >
                            Open Participant Dashboard
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full h-12"
                            onClick={() => { setSuccess(false); setCurrentStep(1); }}
                        >
                            Submit Another Registration
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="w-full max-w-[95%] mx-auto py-12 px-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar */}
                <div className="space-y-6 lg:col-span-1 h-fit static top-8">
                    {/* Steps Card */}
                    <Card className="p-6 border-l-4 border-l-mindSaga-500">
                        <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-6 flex items-center gap-2">
                            Registration Steps
                        </h3>
                        <div className="space-y-6 relative ml-2">
                            <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-[var(--glass-border)] -z-10" />

                            <div className="flex items-start gap-4">
                                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold transition-all ${currentStep >= 1 ? 'bg-mindSaga-500 text-white shadow-lg scale-110' : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]'}`}>
                                    1
                                </div>
                                <div>
                                    <p className={`text-sm font-bold ${currentStep === 1 ? 'text-mindSaga-400' : 'text-[var(--color-text-primary)]'}`}>Personal Information</p>
                                    <p className="text-xs text-[var(--color-text-muted)] mt-1">Basic details & academic info</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold transition-all ${currentStep >= 2 ? 'bg-mindSaga-500 text-white shadow-lg scale-110' : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)]'}`}>
                                    2
                                </div>
                                <div>
                                    <p className={`text-sm font-bold ${currentStep === 2 ? 'text-mindSaga-400' : 'text-[var(--color-text-primary)]'}`}>Payment Details</p>
                                    <p className="text-xs text-[var(--color-text-muted)] mt-1">Payment & verification</p>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Highlights Card */}
                    <Card className="p-6 bg-gradient-to-br from-mindSaga-500/5 to-transparent border-mindSaga-500/10">
                        <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                            Event Highlights
                        </h3>
                        <ul className="space-y-3 list-disc pl-4 text-sm text-[var(--color-text-secondary)]">
                            <li>Placement Oriented Rounds</li>
                            <li>Domain experts judges</li>
                            <li>Networking opportunities</li>
                            <li>Certificates & prizes</li>
                        </ul>
                    </Card>

                    {/* Want to Know More Card */}
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-mindSaga-600 to-gd-500 text-white shadow-xl relative overflow-hidden">
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-1.5 bg-white/20 rounded-full backdrop-blur-sm">
                                    <Sparkles className="w-4 h-4 text-white" />
                                </div>
                                <h3 className="font-bold text-lg">Want to Know More?</h3>
                            </div>
                            <p className="text-sm text-white/90 mb-6 leading-relaxed">
                                Explore detailed sub event information, schedules, and benefits before registering!
                            </p>
                            <button
                                onClick={() => navigate('/sub-events')}
                                className="w-full py-2.5 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white text-sm font-bold hover:bg-white/30 transition-all flex items-center justify-center gap-2"
                            >
                                View All Subevents <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                        {/* Abstract Background Circles */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/30 rounded-full blur-2xl" />
                    </div>
                </div>

                {/* Main Form */}
                <div className="lg:col-span-3">
                    <Card className="p-8 md:p-12 shadow-2xl relative overflow-hidden">
                        {/* Form Header */}
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-bold text-[var(--color-text-primary)]">Step 1: Personal Information</h2>
                            <p className="text-[var(--color-text-secondary)] mt-2">Please fill in your details carefully</p>
                        </div>

                        <AnimatePresence mode="wait">
                            {currentStep === 1 ? (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                        {/* Left Column: Personal Details */}
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3 mb-4 border-b border-[var(--glass-border)] pb-2">
                                                <User className="w-5 h-5 text-mindSaga-500" />
                                                <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Personal Details</h3>
                                            </div>

                                            <div className="space-y-5">
                                                <Input
                                                    label="Full Name *"
                                                    placeholder="Enter your full name"
                                                    {...register('fullName', { required: 'Name is required' })}
                                                    error={errors.fullName?.message}
                                                />
                                                <Input
                                                    label="Email Address *"
                                                    placeholder="example@email.com"
                                                    {...register('email', {
                                                        required: 'Email is required',
                                                        pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' }
                                                    })}
                                                    error={errors.email?.message}
                                                />
                                                <Input
                                                    label="Mobile Number *"
                                                    placeholder="10 digit number"
                                                    {...register('mobile', {
                                                        required: 'Mobile is required',
                                                        pattern: { value: /^[0-9]{10}$/, message: 'Invalid 10-digit number' }
                                                    })}
                                                    error={errors.mobile?.message}
                                                />
                                                <Input
                                                    label="PRN Number *"
                                                    placeholder="Enter your PRN"
                                                    {...register('prn', { required: 'PRN is required' })}
                                                    error={errors.prn?.message}
                                                />
                                            </div>
                                        </div>

                                        {/* Right Column: Academic & Workshop Details */}
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-3 mb-4 border-b border-[var(--glass-border)] pb-2">
                                                <School className="w-5 h-5 text-gd-500" />
                                                <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Academic & Workshop Details</h3>
                                            </div>

                                            <div className="space-y-5">
                                                {/* College */}
                                                <div>
                                                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">College *</label>
                                                    <select
                                                        {...register('college', { required: 'College is required' })}
                                                        className="w-full h-11 px-4 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] focus:border-mindSaga-500 focus:ring-1 focus:ring-mindSaga-500 transition-smooth"
                                                    >
                                                        {settings?.availableColleges?.map(c => <option key={c} value={c}>{c}</option>)}
                                                        <option value="Other">Other</option>
                                                    </select>
                                                    {showOtherCollege && (
                                                        <div className="mt-2">
                                                            <Input
                                                                placeholder="Enter college name"
                                                                {...register('otherCollege', { required: showOtherCollege ? 'College name is required' : false })}
                                                                error={errors.otherCollege?.message}
                                                            />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Year */}
                                                <div>
                                                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Year of Study *</label>
                                                    <select
                                                        {...register('year', { required: 'Year is required' })}
                                                        className="w-full h-11 px-4 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] focus:border-mindSaga-500 focus:ring-1 focus:ring-mindSaga-500 transition-smooth"
                                                    >
                                                        <option value="First Year">First Year</option>
                                                        <option value="Second Year">Second Year</option>
                                                        <option value="Third Year">Third Year</option>
                                                        <option value="Last Year">Last Year</option>
                                                        <option value="Other">Other</option>
                                                    </select>
                                                    {showOtherYear && (
                                                        <div className="mt-2">
                                                            <Input type="number" placeholder="Enter Year" {...register('otherYear')} />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Stream */}
                                                <div>
                                                    <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Stream *</label>
                                                    <select
                                                        {...register('branch', { required: 'Stream is required' })}
                                                        className="w-full h-11 px-4 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] focus:border-mindSaga-500 focus:ring-1 focus:ring-mindSaga-500 transition-smooth"
                                                    >
                                                        {settings?.availableStreams?.map(s => <option key={s} value={s}>{s}</option>)}
                                                        <option value="Other">Other</option>
                                                    </select>
                                                    {showOtherStream && (
                                                        <div className="mt-2">
                                                            <Input placeholder="Enter Stream" {...register('otherStream', { required: showOtherStream })} />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Workshop Selection */}
                                                <div>
                                                    <div className="flex justify-between items-end mb-1">
                                                        <label className="block text-sm font-medium text-[var(--color-text-secondary)]">Sub Event Selection *</label>
                                                        <span className="text-[10px] text-mindSaga-400 font-medium">Can participate in one or all events</span>
                                                    </div>
                                                    <div className="flex flex-col gap-2 p-3 bg-[var(--color-bg-tertiary)] rounded-xl border border-[var(--glass-border)]">
                                                        {subEvents.length > 0 ? subEvents.map(event => {
                                                            const isFull = event.maxParticipants > 0 && event.approvedParticipants >= event.maxParticipants;
                                                            return (
                                                                <label
                                                                    key={event._id}
                                                                    className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${isFull ? 'opacity-50 cursor-not-allowed bg-status-busy/5' : 'cursor-pointer hover:bg-black/5 dark:hover:bg-white/5'}`}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={selectedEvents.includes(event._id)}
                                                                        disabled={isFull}
                                                                        onChange={() => {
                                                                            if (isFull) return;
                                                                            const isSelected = selectedEvents.includes(event._id);
                                                                            if (isSelected) {
                                                                                if (selectedEvents.length === subEvents.length && subEvents.length > 2) {
                                                                                    setSelectedEvents([]);
                                                                                } else {
                                                                                    setSelectedEvents(selectedEvents.filter(id => id !== event._id));
                                                                                }
                                                                            } else {
                                                                                if (selectedEvents.length >= 1) {
                                                                                    setSelectedEvents(subEvents.map(e => e._id));
                                                                                } else {
                                                                                    setSelectedEvents([...selectedEvents, event._id]);
                                                                                }
                                                                            }
                                                                        }}
                                                                        className="w-5 h-5 rounded border-gray-300 text-mindSaga-600 focus:ring-mindSaga-500 disabled:opacity-50"
                                                                    />
                                                                    <div className="flex-1">
                                                                        <div className="flex justify-between items-center">
                                                                            <span className={`font-medium text-sm ${isFull ? 'text-status-busy' : 'text-[var(--color-text-primary)]'}`}>
                                                                                {event.name}
                                                                            </span>
                                                                            {isFull && <span className="text-[10px] font-bold text-status-busy uppercase tracking-widest">(Registrations Full)</span>}
                                                                        </div>
                                                                        <div className="text-xs text-[var(--color-text-muted)] flex justify-end">
                                                                            <span className={`font-bold ${isFull ? 'text-[var(--color-text-muted)]' : 'text-status-available'}`}>₹{event.registrationPrice || 50}</span>
                                                                        </div>
                                                                    </div>
                                                                </label>
                                                            );
                                                        }) : <span className="text-xs text-center text-muted">Loading events...</span>}

                                                        <div className="pt-2 mt-2 border-t border-[var(--glass-border)] flex items-center justify-between">
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const availableEvents = subEvents.filter(e => !(e.maxParticipants > 0 && e.approvedParticipants >= e.maxParticipants));
                                                                    if (selectedEvents.length === availableEvents.length) setSelectedEvents([]);
                                                                    else setSelectedEvents(availableEvents.map(e => e._id));
                                                                }}
                                                                className="text-xs font-bold text-mindSaga-500 hover:underline"
                                                            >
                                                                {selectedEvents.length > 0 && selectedEvents.length === subEvents.filter(e => !(e.maxParticipants > 0 && e.approvedParticipants >= e.maxParticipants)).length
                                                                    ? 'Deselect All'
                                                                    : 'Select Available All Events'}
                                                            </button>
                                                            <div className="text-right">
                                                                {calculation.discount > 0 && (
                                                                    <p className="text-[10px] text-mindSaga-400 line-through">Subtotal: ₹{calculation.subtotal}</p>
                                                                )}
                                                                <span className="text-sm font-black text-status-available">
                                                                    {calculation.discount > 0 ? `Total: ₹${calculation.total} ` : `Total: ₹${calculation.subtotal} `}
                                                                </span>
                                                                {calculation.discount > 0 && (
                                                                    <p className="text-[10px] text-status-available font-bold animate-pulse">Bulk Discount Applied!</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>


                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-8">
                                        <Button
                                            type="button"
                                            variant="primary"
                                            className="w-full h-14 text-lg font-bold shadow-lg shadow-mindSaga-500/20 active:scale-[0.98] transition-all"
                                            onClick={nextStep}
                                        >
                                            Next: Payment Information →
                                        </Button>
                                    </div>
                                </motion.div>
                            ) // End of Step 1
                                : (
                                    <motion.div
                                        key="step2"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-10"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h2 className="text-3xl font-bold text-[var(--color-text-primary)]">Step 2: Complete Payment</h2>
                                                <p className="text-[var(--color-text-secondary)] mt-1">Please verify and complete your payment</p>
                                            </div>
                                            <button
                                                onClick={prevStep}
                                                className="h-9 px-4 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold transition-all flex items-center gap-1"
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                                Back
                                            </button>
                                        </div>

                                        <div className="p-8 rounded-3xl bg-mindSaga-500/5 border border-mindSaga-500/10 space-y-8">
                                            <div className="flex flex-col md:flex-row gap-10">
                                                <div className="flex-1 space-y-6">
                                                    <h3 className="text-xl font-bold text-mindSaga-400">Payment Instructions</h3>
                                                    <div className="space-y-4">
                                                        {[
                                                            "Scan the QR code or use the UPI ID provided",
                                                            `Pay the exact amount of ₹${calculation.total}`,
                                                            "Take a screenshot of the payment confirmation",
                                                            "Upload the screenshot below and enter Transaction ID"
                                                        ].map((step, idx) => (
                                                            <div key={idx} className="flex gap-4 items-center group">
                                                                <div className="w-8 h-8 rounded-full bg-gd-600 text-white flex items-center justify-center text-sm font-black shadow-lg shadow-mindSaga-500/20 group-hover:scale-110 transition-transform flex-shrink-0">
                                                                    {idx + 1}
                                                                </div>
                                                                <p className="text-[var(--color-text-secondary)] text-sm font-medium">{step}</p>
                                                            </div>
                                                        ))}
                                                        {paymentSettings?.paymentInstructions && (
                                                            <div className="mt-4 p-4 rounded-xl bg-mindSaga-500/5 border border-mindSaga-500/10">
                                                                <p className="text-xs font-bold text-mindSaga-400 uppercase tracking-widest mb-2">Note from Admin:</p>
                                                                <p className="text-xs text-[var(--color-text-secondary)] italic leading-relaxed whitespace-pre-wrap">
                                                                    {paymentSettings.paymentInstructions}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {paymentSettings?.bulkDiscount?.enabled && (
                                                        <div className="p-4 rounded-xl bg-status-available/10 border border-status-available/20">
                                                            <p className="text-xs font-bold text-status-available uppercase tracking-wider mb-1">Applied Discounts</p>
                                                            {calculation.discount > 0 ? (
                                                                <p className="text-sm text-status-available">
                                                                    Bulk Discount: ₹{calculation.discount} off (Applied for registering in {selectedEvents.length} events)
                                                                </p>
                                                            ) : (
                                                                <p className="text-sm text-[var(--color-text-muted)] italic">
                                                                    Register for {paymentSettings.bulkDiscount.minEvents} or more events to get a {paymentSettings.bulkDiscount.discountType === 'percentage' ? `${paymentSettings.bulkDiscount.discountValue}% ` : `₹${paymentSettings.bulkDiscount.discountValue} `} discount!
                                                                    (Current: {selectedEvents.length})
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="w-full md:w-64 space-y-4">
                                                    {paymentSettings?.qrCodeEnabled ? (
                                                        <div className="p-4 bg-white rounded-2xl shadow-xl flex flex-col items-center">
                                                            <div className="w-full aspect-square bg-white rounded-lg mb-4 flex items-center justify-center relative group">
                                                                {(() => {
                                                                    // A combo is when all available events are selected OR more than 1 if defined that way
                                                                    // Let's stick with > 1 for broad coverage, but prioritize 'all' if that's the intention
                                                                    const isCombo = selectedEvents.length > 1;
                                                                    const uploadedQr = isCombo ? settings?.allEventsQrCodeUrl : settings?.singleEventQrCodeUrl;
                                                                    const dynamicQr = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
                                                                        `upi://pay?pa=${paymentSettings.upiId}&pn=${paymentSettings.accountName}&am=${calculation.total}&cu=INR`
                                                                    )}`;

                                                                    // Use key to force re-render when image changes
                                                                    return (
                                                                        <img
                                                                            key={uploadedQr || calculation.total}
                                                                            src={uploadedQr || dynamicQr}
                                                                            alt="Payment QR"
                                                                            className="w-full h-auto rounded-lg transition-opacity duration-300"
                                                                        />
                                                                    );
                                                                })()}
                                                                <div className="absolute inset-0 bg-black/5 rounded-lg group-hover:bg-transparent transition-colors" />
                                                            </div>
                                                            <div className="w-full">
                                                                <Button
                                                                    variant="primary"
                                                                    className="w-full py-2.5 h-auto text-xs font-bold bg-mindSaga-600 hover:bg-mindSaga-700 flex items-center justify-center gap-2"
                                                                    onClick={handleDownloadQR}
                                                                >
                                                                    <Download className="w-4 h-4" />
                                                                    Download QR Code
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ) : !paymentSettings ? (
                                                        <div className="h-64 rounded-2xl bg-[var(--color-bg-tertiary)] flex flex-col items-center justify-center border border-dashed border-[var(--glass-border)]">
                                                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-mindSaga-500 mb-2" />
                                                            <p className="text-xs text-[var(--color-text-muted)]">Loading UPI Details...</p>
                                                        </div>
                                                    ) : (
                                                        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                                                            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                                                            <p className="text-xs font-bold text-amber-500">Manual Payment</p>
                                                            <p className="text-[10px] text-[var(--color-text-muted)] mt-1">Please follow the instructions on the left to complete your payment.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-[var(--glass-border)]">
                                                <div>
                                                    <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-bold mb-1">Account Name</p>
                                                    <p className="text-sm font-bold text-[var(--color-text-primary)]">{paymentSettings?.accountName || 'Event Admin'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-bold mb-1">UPI ID</p>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-bold text-mindSaga-400 break-all">{paymentSettings?.upiId}</p>
                                                        <button
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(paymentSettings.upiId);
                                                                toast.success('UPI ID copied!');
                                                            }}
                                                            className="p-1 hover:bg-white/10 rounded transition-colors"
                                                        >
                                                            <CreditCard className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="md:col-span-1">
                                                    <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider font-bold mb-1">Payable Amount</p>
                                                    <div className="flex flex-col">
                                                        <div className="flex items-baseline gap-2">
                                                            <span className="text-2xl font-black text-status-available">₹{calculation.total}</span>
                                                            {calculation.discount > 0 && (
                                                                <span className="text-sm text-[var(--color-text-muted)] line-through">₹{calculation.subtotal}</span>
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] text-mindSaga-400 mt-1 font-medium">
                                                            {calculation.discount > 0 ? `Includes bulk registration discount` : 'Regular Price'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Final Inputs */}
                                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                                            <Input
                                                label="Payment Transaction ID *"
                                                placeholder="Enter 12-digit UPI Transaction ID / Ref No."
                                                {...register('transactionId', {
                                                    required: 'Transaction ID is required',
                                                    minLength: { value: 6, message: 'Too short to be a valid ID' }
                                                })}
                                                error={errors.transactionId?.message}
                                            />

                                            <div className="space-y-3">
                                                <label className="block text-sm font-bold text-[var(--color-text-primary)]">
                                                    Payment Proof Screenshot *
                                                </label>
                                                <div
                                                    onClick={() => document.getElementById('payment-upload').click()}
                                                    className={`py-12 px-6 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center gap-4 transition-all cursor-pointer group hover:shadow-xl ${paymentProof ? 'border-status-available bg-status-available/5' : 'border-[var(--glass-border)] hover:border-mindSaga-500 hover:bg-mindSaga-500/5'}`}
                                                >
                                                    <input
                                                        type="file"
                                                        id="payment-upload"
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={handleFileChange}
                                                    />
                                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 ${paymentProof ? (isUploading ? 'bg-mindSaga-500/10' : 'bg-status-available/10 text-status-available scale-110') : 'bg-mindSaga-500/10 text-mindSaga-500 group-hover:bg-mindSaga-500 group-hover:text-white group-hover:rotate-12'}`}>
                                                        {isUploading ? <Loader className="w-8 h-8 animate-spin" /> : (paymentProof ? <CheckCircle className="w-10 h-10" /> : <Upload className="w-10 h-10" />)}
                                                    </div>
                                                    <div className="text-center space-y-1">
                                                        <p className="text-lg font-black text-[var(--color-text-primary)]">
                                                            {isUploading ? 'Uploading proof...' : (paymentProof ? 'Proof Selected!' : 'Drop screenshot or click to upload')}
                                                        </p>
                                                        {paymentProof && (
                                                            <p className="text-sm font-medium text-status-available animate-pulse">
                                                                {paymentProof.name}
                                                            </p>
                                                        )}
                                                        {!paymentProof && (
                                                            <p className="text-xs text-[var(--color-text-muted)] max-w-xs mx-auto">
                                                                Make sure the Transaction ID & Amount (₹{calculation.total}) are clearly visible.
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <Button
                                                    type="button"
                                                    variant="secondary"
                                                    className="h-14 font-bold bg-slate-500 border-none text-white hover:bg-slate-400"
                                                    onClick={prevStep}
                                                >
                                                    Back
                                                </Button>
                                                <Button
                                                    type="submit"
                                                    variant="primary"
                                                    className="h-14 text-lg font-bold"
                                                    loading={loading}
                                                    disabled={loading}
                                                >
                                                    Complete Registration
                                                </Button>
                                            </div>
                                        </form>
                                    </motion.div>
                                )}
                        </AnimatePresence>
                    </Card>
                </div>
            </div>
        </div >
    );
};

export default RegistrationForm;
