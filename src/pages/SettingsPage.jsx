import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MdSave, MdSettings, MdNotifications, MdSecurity, MdPublic, MdAdd } from 'react-icons/md';
import { Upload } from 'lucide-react';
import axios from '../lib/axios';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import toast from 'react-hot-toast';
import Loader from '../components/ui/Loader';

const SettingsPage = () => {
    const [settings, setSettings] = useState({
        eventName: '',
        eventDate: '',
        registrationDeadline: '',
        isRegistrationOpen: true,
        maintenanceMode: false,
        contactEmail: '',
        maxGlobalParticipants: 0,
        singleEventQrCodeUrl: '',
        twoEventsQrCodeUrl: '',
        allEventsQrCodeUrl: '',
        comboPrice: 150,
        availableStreams: ['Computer Science and Engineering'],
        availableColleges: ["Kit's college of enginnering, Kolhapur"],
        showSubEventsOnPublicPage: false,
        publicSubEventsBannerUrl: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [qrSingleUploading, setQrSingleUploading] = useState(false);
    const [qrTwoUploading, setQrTwoUploading] = useState(false);
    const [qrAllUploading, setQrAllUploading] = useState(false);
    const [bannerUploading, setBannerUploading] = useState(false);
    const [activeSection, setActiveSection] = useState('general');

    const registrationUrl = `${window.location.origin}/register`;
    const publicSubEventsUrl = `${window.location.origin}/sub-events`;

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/admin/settings');
            if (response.data.data) {
                const data = response.data.data;
                setSettings({
                    ...settings,
                    ...data,
                    eventDate: data.eventDate ? new Date(data.eventDate).toISOString().split('T')[0] : '',
                    registrationDeadline: data.registrationDeadline ? new Date(data.registrationDeadline).toISOString().split('T')[0] : ''
                });
            }
        } catch (error) {
            console.error('Failed to fetch settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            await axios.put('/admin/settings', settings);
            toast.success('Settings saved successfully!');
        } catch (error) {
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleQrUpload = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            if (type === 'single') setQrSingleUploading(true);
            else if (type === 'two') setQrTwoUploading(true);
            else setQrAllUploading(true);

            const formData = new FormData();
            formData.append('qrCode', file);

            const response = await axios.post('/admin/settings/upload-qr', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (type === 'single') {
                setSettings({ ...settings, singleEventQrCodeUrl: response.data.url });
            } else if (type === 'two') {
                setSettings({ ...settings, twoEventsQrCodeUrl: response.data.url });
            } else {
                setSettings({ ...settings, allEventsQrCodeUrl: response.data.url });
            }
            toast.success('QR Code uploaded! Press save to apply.');
        } catch (error) {
            toast.error('Failed to upload QR Code');
        } finally {
            if (type === 'single') setQrSingleUploading(false);
            else if (type === 'two') setQrTwoUploading(false);
            else setQrAllUploading(false);
        }
    };

    const handleBannerUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setBannerUploading(true);

            const formData = new FormData();
            formData.append('banner', file);

            const response = await axios.post('/admin/settings/upload-banner', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setSettings({ ...settings, publicSubEventsBannerUrl: response.data.url });
            toast.success('Banner uploaded! Press save to apply.');
        } catch (error) {
            toast.error('Failed to upload banner');
        } finally {
            setBannerUploading(false);
        }
    };

    if (loading) {
        return <Loader message="Loading system settings..." />;
    }

    const sections = [
        { id: 'general', name: 'General', icon: MdSettings },
        { id: 'public', name: 'Public Page', icon: MdPublic },
        { id: 'notifications', name: 'Notifications', icon: MdNotifications },
        { id: 'security', name: 'Security', icon: MdSecurity },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Settings</h1>
                <p className="text-[var(--color-text-secondary)] mt-1">Configure event-wide parameters and system behavior</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar */}
                <div className="w-full lg:w-64 space-y-2">
                    {sections.map(section => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-smooth ${activeSection === section.id
                                ? 'bg-mindSaga-600 text-white shadow-lg'
                                : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]'
                                }`}
                        >
                            <section.icon className="w-5 h-5" />
                            <span className="font-medium">{section.name}</span>
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 max-w-3xl">
                    <form onSubmit={handleSave}>
                        <Card className="p-8 space-y-6">
                            {activeSection === 'general' && (
                                <div className="space-y-6">
                                    <h2 className="text-xl font-bold text-[var(--color-text-primary)] border-b border-[var(--glass-border)] pb-4">General Configuration</h2>

                                    <div className="space-y-4">
                                        <Input
                                            label="Event Name"
                                            value={settings.eventName}
                                            onChange={e => setSettings({ ...settings, eventName: e.target.value })}
                                            placeholder="e.g., TECHNOVATION 2026"
                                        />

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <Input
                                                label="Event Date"
                                                type="date"
                                                value={settings.eventDate}
                                                onChange={e => setSettings({ ...settings, eventDate: e.target.value })}
                                            />
                                            <Input
                                                label="Registration Deadline"
                                                type="date"
                                                value={settings.registrationDeadline}
                                                onChange={e => setSettings({ ...settings, registrationDeadline: e.target.value })}
                                            />
                                        </div>

                                        <Input
                                            label="Contact Email"
                                            type="email"
                                            value={settings.contactEmail}
                                            onChange={e => setSettings({ ...settings, contactEmail: e.target.value })}
                                            placeholder="support@event.com"
                                        />

                                        <div className="pt-4 space-y-4">
                                            <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--color-bg-tertiary)]">
                                                <div>
                                                    <p className="font-semibold text-[var(--color-text-primary)]">Registration System</p>
                                                    <p className="text-sm text-[var(--color-text-muted)]">Allow new participants to sign up</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setSettings({ ...settings, isRegistrationOpen: !settings.isRegistrationOpen })}
                                                    className={`w-12 h-6 rounded-full transition-smooth relative ${settings.isRegistrationOpen ? 'bg-status-available' : 'bg-[var(--color-text-muted)]'}`}
                                                >
                                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-smooth ${settings.isRegistrationOpen ? 'right-1' : 'left-1'}`} />
                                                </button>
                                            </div>

                                            <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--color-bg-tertiary)] border border-status-busy/20">
                                                <div>
                                                    <p className="font-semibold text-status-busy">Maintenance Mode</p>
                                                    <p className="text-sm text-[var(--color-text-muted)]">Take the participant panel offline for updates</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                                                    className={`w-12 h-6 rounded-full transition-smooth relative ${settings.maintenanceMode ? 'bg-status-busy' : 'bg-[var(--color-text-muted)]'}`}
                                                >
                                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-smooth ${settings.maintenanceMode ? 'right-1' : 'left-1'}`} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeSection === 'public' && (
                                <div className="space-y-6">
                                    <h2 className="text-xl font-bold text-[var(--color-text-primary)] border-b border-[var(--glass-border)] pb-4">Public Registration Page</h2>

                                    <div className="space-y-6">
                                        {/* URL Card */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="p-4 rounded-xl bg-mindSaga-500/10 border border-mindSaga-500/20">
                                                <p className="text-sm text-mindSaga-300 mb-1">Public Registration Link</p>
                                                <div className="flex items-center gap-2">
                                                    <code className="flex-1 bg-black/30 p-2 rounded text-sm text-[var(--color-text-primary)] truncate">
                                                        {registrationUrl}
                                                    </code>
                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                        className="py-1 px-3 text-xs"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(registrationUrl);
                                                            toast.success('Link copied!');
                                                        }}
                                                    >
                                                        Copy
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="p-4 rounded-xl bg-debate-500/10 border border-debate-500/20">
                                                <p className="text-sm text-debate-300 mb-1">Public Sub-Events Link</p>
                                                <div className="flex items-center gap-2">
                                                    <code className="flex-1 bg-black/30 p-2 rounded text-sm text-[var(--color-text-primary)] truncate">
                                                        {publicSubEventsUrl}
                                                    </code>
                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                        className="py-1 px-3 text-xs"
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(publicSubEventsUrl);
                                                            toast.success('Link copied!');
                                                        }}
                                                    >
                                                        Copy
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Public Sub-Events Options */}
                                        <div className="p-4 rounded-xl bg-[var(--color-bg-tertiary)] space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="font-semibold text-[var(--color-text-primary)]">Public Sub-Events Page</p>
                                                    <p className="text-sm text-[var(--color-text-muted)]">Show all sub-events on a dedicated public page</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setSettings({ ...settings, showSubEventsOnPublicPage: !settings.showSubEventsOnPublicPage })}
                                                    className={`w-12 h-6 rounded-full transition-smooth relative ${settings.showSubEventsOnPublicPage ? 'bg-mindSaga-600' : 'bg-[var(--color-text-muted)]'}`}
                                                >
                                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-smooth ${settings.showSubEventsOnPublicPage ? 'right-1' : 'left-1'}`} />
                                                </button>
                                            </div>

                                            {settings.showSubEventsOnPublicPage && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    className="pt-4 border-t border-[var(--glass-border)] space-y-4"
                                                >
                                                    <div className="flex flex-col md:flex-row gap-4 items-start">
                                                        <div className="flex-1 w-full">
                                                            <Input
                                                                label="Sub-Events Banner URL"
                                                                value={settings.publicSubEventsBannerUrl}
                                                                onChange={e => setSettings({ ...settings, publicSubEventsBannerUrl: e.target.value })}
                                                                placeholder="https://example.com/banner.png"
                                                            />
                                                        </div>
                                                        <div className="w-full md:w-auto pt-7">
                                                            <input
                                                                type="file"
                                                                id="banner-upload"
                                                                className="hidden"
                                                                accept="image/*"
                                                                onChange={handleBannerUpload}
                                                            />
                                                            <Button
                                                                type="button"
                                                                variant="secondary"
                                                                className="w-full"
                                                                loading={bannerUploading}
                                                                onClick={() => document.getElementById('banner-upload').click()}
                                                            >
                                                                <Upload className="w-4 h-4 mr-2" />
                                                                Upload
                                                            </Button>
                                                        </div>
                                                    </div>

                                                    {settings.publicSubEventsBannerUrl && (
                                                        <div className="p-4 rounded-xl bg-black/20 flex flex-col items-center">
                                                            <img
                                                                src={settings.publicSubEventsBannerUrl}
                                                                alt="Banner Preview"
                                                                className="w-full h-auto max-h-[150px] object-cover rounded-lg border border-[var(--glass-border)]"
                                                            />
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )}
                                        </div>

                                        {/* Dropdown Options Management */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <label className="block text-sm font-bold text-[var(--color-text-primary)]">Registration Prices</label>
                                                </div>
                                                <Input
                                                    label="All Events Combo Price (₹)"
                                                    type="number"
                                                    value={settings.comboPrice}
                                                    onChange={e => setSettings({ ...settings, comboPrice: parseInt(e.target.value) || 0 })}
                                                    placeholder="150"
                                                />
                                            </div>

                                            <div className="space-y-4">
                                                <label className="block text-sm font-bold text-[var(--color-text-primary)]">Available Colleges</label>
                                                <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-[var(--color-bg-tertiary)] border border-[var(--glass-border)] min-h-[100px] items-start content-start">
                                                    {settings.availableColleges?.map((college, idx) => (
                                                        <span key={idx} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-mindSaga-500/10 text-mindSaga-400 text-xs font-semibold border border-mindSaga-500/20 group animate-in fade-in zoom-in duration-200">
                                                            {college}
                                                            <button
                                                                type="button"
                                                                onClick={() => setSettings({ ...settings, availableColleges: settings.availableColleges.filter((_, i) => i !== idx) })}
                                                                className="hover:text-status-busy transition-colors"
                                                            >
                                                                <MdAdd className="w-3.5 h-3.5 rotate-45" />
                                                            </button>
                                                        </span>
                                                    ))}
                                                    <div className="flex gap-2 w-full mt-2">
                                                        <input
                                                            type="text"
                                                            placeholder="Add college..."
                                                            id="new-college"
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    const val = e.target.value.trim();
                                                                    if (val && !settings.availableColleges?.includes(val)) {
                                                                        setSettings({ ...settings, availableColleges: [...(settings.availableColleges || []), val] });
                                                                        e.target.value = '';
                                                                    }
                                                                }
                                                            }}
                                                            className="flex-1 bg-transparent border-none text-sm outline-none text-[var(--color-text-primary)] px-1"
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="primary"
                                                            className="h-8 px-3 text-xs"
                                                            onClick={() => {
                                                                const input = document.getElementById('new-college');
                                                                const val = input.value.trim();
                                                                if (val && !settings.availableColleges?.includes(val)) {
                                                                    setSettings({ ...settings, availableColleges: [...(settings.availableColleges || []), val] });
                                                                    input.value = '';
                                                                }
                                                            }}
                                                        >
                                                            Add
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <label className="block text-sm font-bold text-[var(--color-text-primary)]">Available Streams</label>
                                                <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-[var(--color-bg-tertiary)] border border-[var(--glass-border)] min-h-[100px] items-start content-start">
                                                    {settings.availableStreams?.map((stream, idx) => (
                                                        <span key={idx} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gd-500/10 text-gd-400 text-xs font-semibold border border-gd-500/20 group animate-in fade-in zoom-in duration-200">
                                                            {stream}
                                                            <button
                                                                type="button"
                                                                onClick={() => setSettings({ ...settings, availableStreams: settings.availableStreams.filter((_, i) => i !== idx) })}
                                                                className="hover:text-status-busy transition-colors"
                                                            >
                                                                <MdAdd className="w-3.5 h-3.5 rotate-45" />
                                                            </button>
                                                        </span>
                                                    ))}
                                                    <div className="flex gap-2 w-full mt-2">
                                                        <input
                                                            type="text"
                                                            placeholder="Add stream..."
                                                            id="new-stream"
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    e.preventDefault();
                                                                    const val = e.target.value.trim();
                                                                    if (val && !settings.availableStreams?.includes(val)) {
                                                                        setSettings({ ...settings, availableStreams: [...(settings.availableStreams || []), val] });
                                                                        e.target.value = '';
                                                                    }
                                                                }
                                                            }}
                                                            className="flex-1 bg-transparent border-none text-sm outline-none text-[var(--color-text-primary)] px-1"
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="primary"
                                                            className="h-8 px-3 text-xs"
                                                            onClick={() => {
                                                                const input = document.getElementById('new-stream');
                                                                const val = input.value.trim();
                                                                if (val && !settings.availableStreams?.includes(val)) {
                                                                    setSettings({ ...settings, availableStreams: [...(settings.availableStreams || []), val] });
                                                                    input.value = '';
                                                                }
                                                            }}
                                                        >
                                                            Add
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* QR Codes URLs */}
                                        <div className="space-y-8">
                                            <div className="space-y-4">
                                                <h3 className="font-semibold text-[var(--color-text-primary)]">Single Event Payment QR</h3>
                                                <p className="text-sm text-[var(--color-text-muted)]">Shown when a participant selects only one event.</p>

                                                <div className="flex flex-col md:flex-row gap-4 items-start">
                                                    <div className="flex-1 w-full">
                                                        <Input
                                                            label="Single QR URL"
                                                            value={settings.singleEventQrCodeUrl}
                                                            onChange={e => setSettings({ ...settings, singleEventQrCodeUrl: e.target.value })}
                                                            placeholder="https://example.com/single-qr.png"
                                                        />
                                                    </div>
                                                    <div className="w-full md:w-auto pt-7">
                                                        <input
                                                            type="file"
                                                            id="qr-single-upload"
                                                            className="hidden"
                                                            accept="image/*"
                                                            onChange={(e) => handleQrUpload(e, 'single')}
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="secondary"
                                                            className="w-full"
                                                            loading={qrSingleUploading}
                                                            onClick={() => document.getElementById('qr-single-upload').click()}
                                                        >
                                                            <Upload className="w-4 h-4 mr-2" />
                                                            Upload
                                                        </Button>
                                                    </div>
                                                </div>

                                                {settings.singleEventQrCodeUrl && (
                                                    <div className="mt-2 p-4 rounded-xl bg-[var(--color-bg-tertiary)] flex flex-col items-center">
                                                        <img
                                                            src={settings.singleEventQrCodeUrl}
                                                            alt="Single QR Preview"
                                                            className="max-w-[150px] h-auto rounded-lg border border-[var(--glass-border)]"
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-4">
                                                <h3 className="font-semibold text-[var(--color-text-primary)]">Two Events Payment QR</h3>
                                                <p className="text-sm text-[var(--color-text-muted)]">Shown when a participant selects exactly two events.</p>

                                                <div className="flex flex-col md:flex-row gap-4 items-start">
                                                    <div className="flex-1 w-full">
                                                        <Input
                                                            label="Two Events QR URL"
                                                            value={settings.twoEventsQrCodeUrl}
                                                            onChange={e => setSettings({ ...settings, twoEventsQrCodeUrl: e.target.value })}
                                                            placeholder="https://example.com/two-events-qr.png"
                                                        />
                                                    </div>
                                                    <div className="w-full md:w-auto pt-7">
                                                        <input
                                                            type="file"
                                                            id="qr-two-upload"
                                                            className="hidden"
                                                            accept="image/*"
                                                            onChange={(e) => handleQrUpload(e, 'two')}
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="secondary"
                                                            className="w-full"
                                                            loading={qrTwoUploading}
                                                            onClick={() => document.getElementById('qr-two-upload').click()}
                                                        >
                                                            <Upload className="w-4 h-4 mr-2" />
                                                            Upload
                                                        </Button>
                                                    </div>
                                                </div>

                                                {settings.twoEventsQrCodeUrl && (
                                                    <div className="mt-2 p-4 rounded-xl bg-[var(--color-bg-tertiary)] flex flex-col items-center">
                                                        <img
                                                            src={settings.twoEventsQrCodeUrl}
                                                            alt="Two Events QR Preview"
                                                            className="max-w-[150px] h-auto rounded-lg border border-[var(--glass-border)]"
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-4">
                                                <h3 className="font-semibold text-[var(--color-text-primary)]">All Events Combo QR</h3>
                                                <p className="text-sm text-[var(--color-text-muted)]">Shown when a participant selects multiple events (Combo - 3 or more).</p>

                                                <div className="flex flex-col md:flex-row gap-4 items-start">
                                                    <div className="flex-1 w-full">
                                                        <Input
                                                            label="Combo QR URL"
                                                            value={settings.allEventsQrCodeUrl}
                                                            onChange={e => setSettings({ ...settings, allEventsQrCodeUrl: e.target.value })}
                                                            placeholder="https://example.com/combo-qr.png"
                                                        />
                                                    </div>
                                                    <div className="w-full md:w-auto pt-7">
                                                        <input
                                                            type="file"
                                                            id="qr-all-upload"
                                                            className="hidden"
                                                            accept="image/*"
                                                            onChange={(e) => handleQrUpload(e, 'all')}
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="secondary"
                                                            className="w-full"
                                                            loading={qrAllUploading}
                                                            onClick={() => document.getElementById('qr-all-upload').click()}
                                                        >
                                                            <Upload className="w-4 h-4 mr-2" />
                                                            Upload
                                                        </Button>
                                                    </div>
                                                </div>

                                                {settings.allEventsQrCodeUrl && (
                                                    <div className="mt-2 p-4 rounded-xl bg-[var(--color-bg-tertiary)] flex flex-col items-center">
                                                        <img
                                                            src={settings.allEventsQrCodeUrl}
                                                            alt="Combo QR Preview"
                                                            className="max-w-[150px] h-auto rounded-lg border border-[var(--glass-border)]"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeSection !== 'general' && activeSection !== 'public' && (
                                <div className="h-64 flex flex-col items-center justify-center text-center space-y-4">
                                    <div className="w-16 h-16 rounded-full bg-mindSaga-600/10 flex items-center justify-center text-mindSaga-500">
                                        <MdSettings className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-[var(--color-text-primary)]">{sections.find(s => s.id === activeSection).name} Settings</h3>
                                        <p className="text-[var(--color-text-muted)]">More advanced configuration options coming soon.</p>
                                    </div>
                                </div>
                            )}

                            <div className="pt-6 flex justify-end">
                                <Button type="submit" variant="primary" className="px-8" loading={saving}>
                                    <MdSave className="w-5 h-5 mr-1" />
                                    Save Settings
                                </Button>
                            </div>
                        </Card>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;
