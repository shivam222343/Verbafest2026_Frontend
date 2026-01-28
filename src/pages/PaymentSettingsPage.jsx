import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    MdSave, MdRefresh, MdPayment, MdDiscount, MdQrCode,
    MdAccountBalance, MdEdit, MdInfo
} from 'react-icons/md';
import axios from '../lib/axios';
import toast from 'react-hot-toast';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Loader from '../components/ui/Loader';

const PaymentSettingsPage = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        upiId: '',
        accountName: '',
        bulkRegistrationDiscount: {
            enabled: false,
            minEvents: 3,
            discountType: 'percentage',
            discountValue: 10
        },
        qrCodeEnabled: true,
        paymentInstructions: ''
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/admin/payment-settings');
            setSettings(response.data.data);
        } catch (error) {
            console.error('Failed to fetch payment settings:', error);
            toast.error('Failed to load payment settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await axios.put('/admin/payment-settings', settings);
            toast.success('Payment settings updated successfully!');
        } catch (error) {
            console.error('Failed to save settings:', error);
            toast.error('Failed to save payment settings');
        } finally {
            setSaving(false);
        }
    };

    const handleDiscountChange = (field, value) => {
        setSettings({
            ...settings,
            bulkRegistrationDiscount: {
                ...settings.bulkRegistrationDiscount,
                [field]: value
            }
        });
    };

    if (loading) {
        return <Loader message="Loading payment settings..." />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
                        Payment Settings
                    </h1>
                    <p className="text-[var(--color-text-secondary)]">
                        Configure UPI details and registration discounts
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={fetchSettings}>
                        <MdRefresh className="w-5 h-5" />
                        Refresh
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                        <MdSave className="w-5 h-5" />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* UPI Payment Details */}
                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-lg bg-mindSaga-600/20 flex items-center justify-center">
                            <MdPayment className="w-6 h-6 text-mindSaga-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                                UPI Payment Details
                            </h2>
                            <p className="text-sm text-[var(--color-text-muted)]">
                                Configure payment account information
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Input
                            label="Account Name"
                            value={settings.accountName}
                            onChange={(e) => setSettings({ ...settings, accountName: e.target.value })}
                            placeholder="e.g., Event Management Team"
                            icon={MdAccountBalance}
                        />

                        <Input
                            label="UPI ID"
                            value={settings.upiId}
                            onChange={(e) => setSettings({ ...settings, upiId: e.target.value })}
                            placeholder="e.g., admin@upi"
                            icon={MdPayment}
                        />

                        <div>
                            <label className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-secondary)] mb-2">
                                <MdQrCode className="w-4 h-4" />
                                Enable QR Code Payment
                            </label>
                            <label className="flex items-center gap-3 p-4 rounded-xl bg-[var(--color-bg-tertiary)] cursor-pointer hover:bg-[var(--color-bg-tertiary)]/80 transition-smooth">
                                <input
                                    type="checkbox"
                                    checked={settings.qrCodeEnabled}
                                    onChange={(e) => setSettings({ ...settings, qrCodeEnabled: e.target.checked })}
                                    className="w-5 h-5 rounded border-2 border-[var(--input-border)] text-mindSaga-600 focus:ring-2 focus:ring-mindSaga-500"
                                />
                                <span className="text-sm text-[var(--color-text-primary)]">
                                    Show QR code for UPI payments
                                </span>
                            </label>
                        </div>

                        <div>
                            <label className="text-sm font-semibold text-[var(--color-text-secondary)] mb-2 block">
                                Payment Instructions
                            </label>
                            <textarea
                                value={settings.paymentInstructions}
                                onChange={(e) => setSettings({ ...settings, paymentInstructions: e.target.value })}
                                rows={3}
                                className="w-full px-4 py-2 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] focus:ring-2 focus:ring-mindSaga-500 outline-none resize-none"
                                placeholder="Instructions for participants..."
                            />
                        </div>
                    </div>
                </Card>

                {/* Bulk Registration Discount */}
                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 rounded-lg bg-status-available/20 flex items-center justify-center">
                            <MdDiscount className="w-6 h-6 text-status-available" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                                Bulk Registration Discount
                            </h2>
                            <p className="text-sm text-[var(--color-text-muted)]">
                                Offer discounts for multiple event registrations
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="flex items-center gap-3 p-4 rounded-xl bg-[var(--color-bg-tertiary)] cursor-pointer hover:bg-[var(--color-bg-tertiary)]/80 transition-smooth">
                            <input
                                type="checkbox"
                                checked={settings.bulkRegistrationDiscount.enabled}
                                onChange={(e) => handleDiscountChange('enabled', e.target.checked)}
                                className="w-5 h-5 rounded border-2 border-[var(--input-border)] text-mindSaga-600 focus:ring-2 focus:ring-mindSaga-500"
                            />
                            <div>
                                <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                                    Enable Bulk Discount
                                </p>
                                <p className="text-xs text-[var(--color-text-muted)]">
                                    Automatically apply discount when participants register for multiple events
                                </p>
                            </div>
                        </label>

                        {settings.bulkRegistrationDiscount.enabled && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="space-y-4"
                            >
                                <Input
                                    label="Minimum Events Required"
                                    type="number"
                                    min="2"
                                    value={settings.bulkRegistrationDiscount.minEvents}
                                    onChange={(e) => handleDiscountChange('minEvents', parseInt(e.target.value))}
                                    placeholder="e.g., 3"
                                />

                                <div>
                                    <label className="text-sm font-semibold text-[var(--color-text-secondary)] mb-2 block">
                                        Discount Type
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => handleDiscountChange('discountType', 'percentage')}
                                            className={`p-3 rounded-lg border-2 transition-smooth ${settings.bulkRegistrationDiscount.discountType === 'percentage'
                                                ? 'border-mindSaga-500 bg-mindSaga-600/20 text-mindSaga-400'
                                                : 'border-[var(--glass-border)] text-[var(--color-text-secondary)] hover:border-mindSaga-500/50'
                                                }`}
                                        >
                                            <p className="font-semibold">Percentage</p>
                                            <p className="text-xs">% off total</p>
                                        </button>
                                        <button
                                            onClick={() => handleDiscountChange('discountType', 'fixed')}
                                            className={`p-3 rounded-lg border-2 transition-smooth ${settings.bulkRegistrationDiscount.discountType === 'fixed'
                                                ? 'border-mindSaga-500 bg-mindSaga-600/20 text-mindSaga-400'
                                                : 'border-[var(--glass-border)] text-[var(--color-text-secondary)] hover:border-mindSaga-500/50'
                                                }`}
                                        >
                                            <p className="font-semibold">Fixed Amount</p>
                                            <p className="text-xs">₹ off total</p>
                                        </button>
                                    </div>
                                </div>

                                <Input
                                    label={`Discount Value (${settings.bulkRegistrationDiscount.discountType === 'percentage' ? '%' : '₹'})`}
                                    type="number"
                                    min="0"
                                    value={settings.bulkRegistrationDiscount.discountValue}
                                    onChange={(e) => handleDiscountChange('discountValue', parseFloat(e.target.value))}
                                    placeholder={settings.bulkRegistrationDiscount.discountType === 'percentage' ? 'e.g., 10' : 'e.g., 50'}
                                />

                                {/* Preview */}
                                <div className="p-4 rounded-lg bg-mindSaga-600/10 border border-mindSaga-600/20">
                                    <div className="flex items-start gap-2 mb-2">
                                        <MdInfo className="w-5 h-5 text-mindSaga-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-semibold text-mindSaga-400">
                                                Discount Preview
                                            </p>
                                            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                                                When a participant registers for {settings.bulkRegistrationDiscount.minEvents} or more events,
                                                they will receive a{' '}
                                                <span className="font-bold text-status-available">
                                                    {settings.bulkRegistrationDiscount.discountType === 'percentage'
                                                        ? `${settings.bulkRegistrationDiscount.discountValue}%`
                                                        : `₹${settings.bulkRegistrationDiscount.discountValue}`}
                                                </span>
                                                {' '}discount on the total registration amount.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Current Settings Display */}
            <Card className="p-6">
                <h3 className="text-lg font-bold text-[var(--color-text-primary)] mb-4">
                    Current Configuration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-[var(--color-bg-tertiary)]">
                        <p className="text-xs text-[var(--color-text-muted)] mb-1">UPI ID</p>
                        <p className="font-mono font-bold text-mindSaga-400">{settings.upiId}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-[var(--color-bg-tertiary)]">
                        <p className="text-xs text-[var(--color-text-muted)] mb-1">Account Name</p>
                        <p className="font-semibold text-[var(--color-text-primary)]">{settings.accountName}</p>
                    </div>
                    <div className="p-4 rounded-lg bg-[var(--color-bg-tertiary)]">
                        <p className="text-xs text-[var(--color-text-muted)] mb-1">Bulk Discount</p>
                        <p className="font-semibold text-[var(--color-text-primary)]">
                            {settings.bulkRegistrationDiscount.enabled ? (
                                <span className="text-status-available">
                                    {settings.bulkRegistrationDiscount.discountType === 'percentage'
                                        ? `${settings.bulkRegistrationDiscount.discountValue}%`
                                        : `₹${settings.bulkRegistrationDiscount.discountValue}`}
                                    {' '}(min {settings.bulkRegistrationDiscount.minEvents} events)
                                </span>
                            ) : (
                                <span className="text-[var(--color-text-muted)]">Disabled</span>
                            )}
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default PaymentSettingsPage;
