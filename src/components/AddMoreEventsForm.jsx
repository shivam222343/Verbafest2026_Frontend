import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import {
    Upload, Loader, CheckCircle, AlertCircle, RefreshCw, Plus
} from 'lucide-react';
import { MdEvent, MdLocalFireDepartment, MdWhatsapp } from 'react-icons/md';
import axios from '../lib/axios';
import Button from './ui/Button';
import Input from './ui/Input';
import Card from './ui/Card';
import toast from 'react-hot-toast';

const AddMoreEventsForm = ({ participant, onSuccess }) => {
    const [allSubEvents, setAllSubEvents] = useState([]);
    const [availableEvents, setAvailableEvents] = useState([]);
    const [selectedEvents, setSelectedEvents] = useState([]);
    const [paymentProof, setPaymentProof] = useState(null);
    const [uploadedUrl, setUploadedUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [paymentSettings, setPaymentSettings] = useState(null);

    const { register, handleSubmit, formState: { errors } } = useForm();

    useEffect(() => {
        fetchSubEvents();
        fetchPaymentSettings();
    }, [participant]);

    const fetchSubEvents = async () => {
        try {
            const res = await axios.get('/registration/form');
            const events = res.data.data;
            setAllSubEvents(events);

            // Filter out events the participant is already registered for
            const registeredIds = participant.registeredSubEvents.map(e => e._id || e);
            const filtered = events.filter(e => !registeredIds.includes(e._id));

            // Further filter by seat availability
            const available = filtered.filter(e => !e.maxParticipants || e.approvedParticipants < e.maxParticipants);

            setAvailableEvents(available);
        } catch (error) {
            toast.error('Failed to load events');
        }
    };

    const fetchPaymentSettings = async () => {
        try {
            const res = await axios.get('/registration/payment-settings');
            setPaymentSettings(res.data.data);
        } catch (error) {
            console.error('Failed to load payment settings');
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('File size must be less than 5MB');
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
                toast.error('Failed to upload screenshot');
                setPaymentProof(null);
            } finally {
                setIsUploading(false);
            }
        }
    };

    const toggleEventSelection = (eventId) => {
        setSelectedEvents(prev =>
            prev.includes(eventId)
                ? prev.filter(id => id !== eventId)
                : [...prev, eventId]
        );
    };

    const calculateTotal = () => {
        return selectedEvents.reduce((total, id) => {
            const event = availableEvents.find(e => e._id === id);
            return total + (event?.registrationPrice || 50);
        }, 0);
    };

    const onSubmit = async (data) => {
        if (selectedEvents.length === 0) {
            toast.error('Please select at least one event');
            return;
        }

        if (!uploadedUrl) {
            toast.error('Please upload payment proof');
            return;
        }

        try {
            setLoading(true);

            const submitData = {
                subEventIds: selectedEvents,
                transactionId: data.transactionId,
                paymentProofUrl: uploadedUrl,
                paidAmount: calculateTotal()
            };

            await axios.post('/participant/add-events', submitData);

            toast.success('Additional registration submitted! Waiting for admin approval.');
            onSuccess();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to submit registration');
        } finally {
            setLoading(false);
        }
    };

    if (availableEvents.length === 0) {
        return (
            <Card className="p-8 text-center bg-status-available/5 border-dashed border-2 border-status-available/20">
                <CheckCircle className="w-12 h-12 text-status-available mx-auto mb-4" />
                <h3 className="text-lg font-bold text-[var(--color-text-primary)]">You're All Set!</h3>
                <p className="text-sm text-[var(--color-text-muted)] mt-2">
                    You have either registered for all available events or there are no seats left in other events.
                </p>
            </Card>
        );
    }

    const total = calculateTotal();

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <h3 className="text-2xl font-black text-[var(--color-text-primary)] flex items-center gap-2">
                    <MdLocalFireDepartment className="text-amber-500" /> Discover More Events
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)]">
                    Want to double the fun? Participate in more events and showcase your talents!
                </p>
            </div>

            {/* Event Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableEvents.map((event) => {
                    const isSelected = selectedEvents.includes(event._id);
                    return (
                        <motion.div
                            key={event._id}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => toggleEventSelection(event._id)}
                            className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden group ${isSelected
                                ? 'border-mindSaga-500 bg-mindSaga-500/10 shadow-lg shadow-mindSaga-500/10'
                                : 'border-[var(--glass-border)] bg-[var(--color-bg-tertiary)] hover:border-mindSaga-500/50'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-3 relative z-10">
                                <div className={`p-2 rounded-xl ${isSelected ? 'bg-mindSaga-500 text-white' : 'bg-mindSaga-500/10 text-mindSaga-400'}`}>
                                    <MdEvent className="w-5 h-5" />
                                </div>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-mindSaga-500 border-mindSaga-500 text-white' : 'border-[var(--glass-border)]'
                                    }`}>
                                    {isSelected && <CheckCircle className="w-4 h-4" />}
                                </div>
                            </div>
                            <h4 className="font-bold text-[var(--color-text-primary)] relative z-10">{event.name}</h4>
                            <p className="text-xs text-[var(--color-text-muted)] mt-1 line-clamp-2 relative z-10">{event.description}</p>
                            <div className="mt-4 flex justify-between items-center relative z-10">
                                <span className="text-xs font-bold text-mindSaga-400 uppercase tracking-widest">₹{event.registrationPrice || 50}</span>
                                <span className="text-[10px] text-[var(--color-text-muted)] font-medium bg-[var(--color-bg-primary)] px-2 py-1 rounded-lg">
                                    Individual
                                </span>
                            </div>

                            {/* Abstract background shape */}
                            <div className={`absolute -right-4 -bottom-4 w-20 h-20 rounded-full opacity-5 transition-transform duration-500 group-hover:scale-150 ${isSelected ? 'bg-mindSaga-500' : 'bg-white'
                                }`} />
                        </motion.div>
                    );
                })}
            </div>

            {selectedEvents.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                >
                    <Card className="p-6 bg-amber-500/5 border-amber-500/20">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="space-y-1 text-center md:text-left">
                                <h4 className="text-lg font-bold text-[var(--color-text-primary)]">Payment Required</h4>
                                <p className="text-sm text-[var(--color-text-secondary)]">Please pay ₹{total} to the UPI ID below to confirm your slots.</p>
                            </div>
                            {paymentSettings && (
                                <div className="bg-white p-3 rounded-xl shadow-inner">
                                    {(() => {
                                        let qrCodeUrl = paymentSettings.singleEventQrCodeUrl || paymentSettings.allEventsQrCodeUrl;
                                        if (selectedEvents.length === 2) {
                                            qrCodeUrl = paymentSettings.twoEventsQrCodeUrl || paymentSettings.allEventsQrCodeUrl || paymentSettings.singleEventQrCodeUrl;
                                        } else if (selectedEvents.length >= 3) {
                                            qrCodeUrl = paymentSettings.allEventsQrCodeUrl || paymentSettings.singleEventQrCodeUrl;
                                        }
                                        return qrCodeUrl ? (
                                            <img
                                                src={qrCodeUrl}
                                                alt="Pay QR"
                                                className="w-32 h-32 object-contain"
                                            />
                                        ) : (
                                            <div className="w-32 h-32 flex items-center justify-center border-2 border-dashed border-[var(--glass-border)] rounded-lg">
                                                <Upload className="w-8 h-8 text-[var(--color-text-muted)]" />
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}
                        </div>
                        <div className="mt-4 p-4 bg-white/5 rounded-xl border border-[var(--glass-border)] flex flex-wrap justify-between gap-4 text-sm">
                            <div>
                                <span className="text-[var(--color-text-muted)] font-medium">UPI ID:</span>
                                <span className="ml-2 font-black text-amber-600">{paymentSettings?.upiId}</span>
                            </div>
                            <div>
                                <span className="text-[var(--color-text-muted)] font-medium">Total Amount:</span>
                                <span className="ml-2 font-black text-status-available">₹{total}</span>
                            </div>
                        </div>

                        {/* Discount Note */}
                        <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-[11px] font-medium text-amber-700 leading-relaxed italic">
                                <strong>Note:</strong> Registration discounts are only applicable during the initial registration. Additional event registrations are charged at their standard individual rates.
                            </p>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="space-y-3">
                                <label className="block text-sm font-bold text-[var(--color-text-primary)]">
                                    Payment Screenshot *
                                </label>
                                <div
                                    onClick={() => document.getElementById('add-event-proof').click()}
                                    className={`py-10 px-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-3 transition-all cursor-pointer hover:bg-mindSaga-500/5 ${paymentProof ? 'border-status-available bg-status-available/5' : 'border-[var(--glass-border)]'
                                        }`}
                                >
                                    <input
                                        type="file"
                                        id="add-event-proof"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                    {isUploading ? (
                                        <Loader className="w-8 h-8 animate-spin text-mindSaga-500" />
                                    ) : paymentProof ? (
                                        <CheckCircle className="w-10 h-10 text-status-available" />
                                    ) : (
                                        <Upload className="w-10 h-10 text-[var(--color-text-muted)]" />
                                    )}
                                    <p className="text-sm font-bold text-[var(--color-text-primary)] text-center">
                                        {isUploading ? 'Uploading...' : paymentProof ? 'Screenshot Added' : 'Upload Proof of Payment'}
                                    </p>
                                </div>
                            </div>

                            <Input
                                label="Transaction ID *"
                                placeholder="Enter UPI Ref No."
                                {...register('transactionId', { required: 'Required' })}
                                error={errors.transactionId?.message}
                            />

                            <Button
                                type="submit"
                                variant="primary"
                                className="w-full h-12 font-bold text-lg"
                                loading={loading}
                                disabled={loading || isUploading || !uploadedUrl}
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                Join Additional Events
                            </Button>
                        </form>
                    </Card>
                </motion.div>
            )}
        </div>
    );
};

export default AddMoreEventsForm;
