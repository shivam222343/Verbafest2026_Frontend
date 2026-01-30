import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import {
    Upload, Loader, CheckCircle, AlertCircle, X, RefreshCw
} from 'lucide-react';
import axios from '../lib/axios';
import Button from './ui/Button';
import Input from './ui/Input';
import Card from './ui/Card';
import toast from 'react-hot-toast';

const ReRegistrationForm = ({ participant, onSuccess }) => {
    const [allSubEvents, setAllSubEvents] = useState([]);
    const [selectedEvents, setSelectedEvents] = useState([]);
    const [paymentProof, setPaymentProof] = useState(null);
    const [uploadedUrl, setUploadedUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [paymentSettings, setPaymentSettings] = useState(null);

    const { register, handleSubmit, formState: { errors }, watch } = useForm();

    useEffect(() => {
        // Auto-populate selected events from participant's original registration
        if (participant?.registeredSubEvents) {
            const eventIds = participant.registeredSubEvents.map(e => e._id || e);
            setSelectedEvents(eventIds);
        }
        fetchSubEvents();
        fetchPaymentSettings();
    }, [participant]);

    const fetchSubEvents = async () => {
        try {
            const res = await axios.get('/registration/form');
            setAllSubEvents(res.data.data);
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
            // Set default values
            setPaymentSettings({
                singleEventQrCodeUrl: null,
                allEventsQrCodeUrl: null,
                upiId: 'Not available',
                accountName: 'Event Account',
                accountNumber: 'Not configured',
                ifscCode: 'Not configured',
                bankName: 'Not configured',
                basePrice: 100,
                bulkDiscount: 0
            });
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

    const calculateTotal = () => {
        // Use the original paid amount from the participant's first registration
        // This ensures they pay the same amount they were supposed to pay originally
        return participant?.paidAmount || 0;
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
                paymentProofUrl: uploadedUrl
            };

            await axios.post('/participant/resubmit-payment', submitData);

            toast.success('Payment details resubmitted successfully! Waiting for admin approval.');
            onSuccess();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to resubmit payment');
        } finally {
            setLoading(false);
        }
    };

    const total = calculateTotal();

    return (
        <div className="space-y-6">
            {/* Payment Instructions */}
            {paymentSettings && (
                <Card className="p-6 bg-mindSaga-500/5 border-mindSaga-500/20">
                    <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-mindSaga-500" />
                        Payment Instructions
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="text-sm font-bold text-[var(--color-text-muted)] uppercase mb-2">UPI Payment</h4>
                            {(() => {
                                // Show appropriate QR code based on number of events
                                let qrCodeUrl = paymentSettings.singleEventQrCodeUrl || paymentSettings.allEventsQrCodeUrl;

                                if (selectedEvents.length === 2) {
                                    qrCodeUrl = paymentSettings.twoEventsQrCodeUrl || paymentSettings.allEventsQrCodeUrl || paymentSettings.singleEventQrCodeUrl;
                                } else if (selectedEvents.length >= 3) {
                                    qrCodeUrl = paymentSettings.allEventsQrCodeUrl || paymentSettings.singleEventQrCodeUrl;
                                }

                                return qrCodeUrl ? (
                                    <div className="bg-white p-4 rounded-xl inline-block mb-3">
                                        <img
                                            src={qrCodeUrl}
                                            alt="Payment QR Code"
                                            className="w-48 h-48 object-contain"
                                        />
                                    </div>
                                ) : null;
                            })()}
                            <p className="text-sm text-[var(--color-text-secondary)]">
                                <span className="font-bold">UPI ID:</span> {paymentSettings.upiId}
                            </p>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-[var(--color-text-muted)] uppercase mb-2">Bank Transfer</h4>
                            <div className="space-y-2 text-sm text-[var(--color-text-secondary)]">
                                <p><span className="font-bold">Account Name:</span> {paymentSettings.accountName}</p>
                                <p><span className="font-bold">Account Number:</span> {paymentSettings.accountNumber}</p>
                                <p><span className="font-bold">IFSC Code:</span> {paymentSettings.ifscCode}</p>
                                <p><span className="font-bold">Bank:</span> {paymentSettings.bankName}</p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                        <p className="text-sm text-[var(--color-text-primary)]">
                            <span className="font-bold">Amount to Pay:</span> ₹{total}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)] mt-1">
                            Same amount as your original registration
                        </p>
                    </div>
                </Card>
            )}

            {/* Event Selection - Read Only */}
            <Card className="p-6">
                <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">
                    Your Registered Events
                </h3>
                <p className="text-sm text-[var(--color-text-muted)] mb-4">
                    You are re-uploading payment proof for the following events:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {allSubEvents
                        .filter(event => selectedEvents.includes(event._id))
                        .map((event) => (
                            <div
                                key={event._id}
                                className="p-4 rounded-xl border-2 border-mindSaga-500 bg-mindSaga-500/10"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <h4 className="font-bold text-[var(--color-text-primary)]">{event.name}</h4>
                                        <p className="text-xs text-[var(--color-text-muted)] mt-1">{event.type}</p>
                                    </div>
                                    <div className="w-6 h-6 rounded-full border-2 border-mindSaga-500 bg-mindSaga-500 flex items-center justify-center">
                                        <CheckCircle className="w-4 h-4 text-white" />
                                    </div>
                                </div>
                            </div>
                        ))}
                </div>
                <div className="mt-4 p-4 bg-[var(--color-bg-tertiary)] rounded-xl">
                    <p className="text-sm font-bold text-[var(--color-text-primary)]">
                        Total Events: {selectedEvents.length} | Amount to Pay: ₹{total}
                    </p>
                </div>

                {selectedEvents.length === 2 && (
                    <div className="mt-6 p-5 rounded-2xl bg-status-available/5 border border-status-available/20 space-y-3">
                        <div className="flex items-center gap-2 mb-1">
                            <CheckCircle className="w-5 h-5 text-status-available" />
                            <h4 className="text-sm font-bold text-[var(--color-text-primary)]">WhatsApp Group Links</h4>
                        </div>
                        <p className="text-xs text-[var(--color-text-secondary)] mb-3 italic">Join these groups for your selected events:</p>
                        <div className="space-y-2">
                            {allSubEvents
                                .filter(event => selectedEvents.includes(event._id))
                                .map(event => event.whatsappGroupLink ? (
                                    <div key={event._id} className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-[var(--glass-border)]">
                                        <span className="text-xs font-medium text-[var(--color-text-primary)]">{event.name}</span>
                                        <a
                                            href={event.whatsappGroupLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-3 py-1 rounded-lg bg-[#25D366] text-white text-[10px] font-bold hover:bg-[#128C7E] transition-all"
                                        >
                                            Join Group
                                        </a>
                                    </div>
                                ) : null)}
                        </div>
                    </div>
                )}
            </Card>

            {/* Payment Form */}
            <Card className="p-6">
                <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">
                    Payment Details
                </h3>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Payment Proof Upload */}
                    <div className="space-y-3">
                        <label className="block text-sm font-bold text-[var(--color-text-primary)]">
                            Payment Proof Screenshot *
                        </label>
                        <div
                            onClick={() => document.getElementById('reupload-payment').click()}
                            className={`py-12 px-6 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-4 transition-all cursor-pointer group hover:shadow-xl ${paymentProof
                                ? 'border-status-available bg-status-available/5'
                                : 'border-[var(--glass-border)] hover:border-mindSaga-500 hover:bg-mindSaga-500/5'
                                }`}
                        >
                            <input
                                type="file"
                                id="reupload-payment"
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 ${paymentProof
                                ? isUploading
                                    ? 'bg-mindSaga-500/10'
                                    : 'bg-status-available/10 text-status-available scale-110'
                                : 'bg-mindSaga-500/10 text-mindSaga-500 group-hover:bg-mindSaga-500 group-hover:text-white group-hover:rotate-12'
                                }`}>
                                {isUploading ? (
                                    <Loader className="w-8 h-8 animate-spin" />
                                ) : paymentProof ? (
                                    <CheckCircle className="w-10 h-10" />
                                ) : (
                                    <Upload className="w-10 h-10" />
                                )}
                            </div>
                            <div className="text-center space-y-1">
                                <p className="text-lg font-black text-[var(--color-text-primary)]">
                                    {isUploading
                                        ? 'Uploading to cloud...'
                                        : paymentProof && uploadedUrl
                                            ? 'Uploaded Successfully!'
                                            : 'Drop screenshot or click to upload'}
                                </p>
                                {paymentProof && uploadedUrl && (
                                    <p className="text-sm font-medium text-status-available">{paymentProof.name}</p>
                                )}
                                {!paymentProof && (
                                    <p className="text-xs text-[var(--color-text-muted)] max-w-xs mx-auto">
                                        Make sure the Transaction ID & Amount (₹{total}) are clearly visible.
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Transaction ID */}
                    <Input
                        label="Payment Transaction ID *"
                        placeholder="Enter 12-digit UPI Transaction ID / Ref No."
                        onInput={(e) => {
                            e.target.value = e.target.value.replace(/[^A-Za-z0-9]/g, '');
                        }}
                        {...register('transactionId', {
                            required: 'Transaction ID is required',
                            minLength: { value: 6, message: 'Transaction ID must be at least 6 characters' },
                            maxLength: { value: 30, message: 'Transaction ID is too long' },
                            pattern: {
                                value: /^[A-Za-z0-9]+$/,
                                message: 'Transaction ID should only contain letters and numbers'
                            }
                        })}
                        error={errors.transactionId?.message}
                    />

                    {/* Submit Button */}
                    <Button
                        type="submit"
                        variant="primary"
                        className="w-full h-14 text-lg font-bold"
                        loading={loading}
                        disabled={loading || isUploading || !uploadedUrl || selectedEvents.length === 0}
                    >
                        <RefreshCw className="w-5 h-5" />
                        Resubmit Payment for Approval
                    </Button>
                </form>
            </Card>
        </div>
    );
};

export default ReRegistrationForm;
