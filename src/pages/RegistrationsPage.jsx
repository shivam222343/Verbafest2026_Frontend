import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdCheckCircle, MdCancel, MdRemoveRedEye, MdSearch, MdFilterList } from 'react-icons/md';
import { FiExternalLink } from 'react-icons/fi';
import axios from '../lib/axios';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import toast from 'react-hot-toast';
import ConfirmationModal from '../components/ui/ConfirmationModal';

const RegistrationsPage = () => {
    const [pendingParticipants, setPendingParticipants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProof, setSelectedProof] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);
    const [rejectModal, setRejectModal] = useState({ show: false, id: null, reason: '' });

    useEffect(() => {
        fetchPendingRegistrations();
    }, []);

    const fetchPendingRegistrations = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/admin/participants/pending');
            setPendingParticipants(response.data.data);
        } catch (error) {
            console.error('Error fetching pending registrations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            setActionLoading(id);
            await axios.put(`/admin/participants/${id}/approve`);
            setPendingParticipants(prev => prev.filter(p => p._id !== id));
            toast.success('Registration approved!');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Approval failed');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = (id) => {
        setRejectModal({ show: true, id, reason: '' });
    };

    const confirmReject = async () => {
        if (!rejectModal.reason.trim()) {
            toast.error('Please provide a reason for rejection');
            return;
        }

        try {
            setActionLoading(rejectModal.id);
            setRejectModal(prev => ({ ...prev, show: false })); // Close modal immediately or wait? Better close and show loading on the list item?
            // Actually, if I close it, I lose the 'loading' state on the button inside modal if I used it.
            // But here I'm setting actionLoading on the item row.

            await axios.put(`/admin/participants/${rejectModal.id}/reject`, { adminNote: rejectModal.reason });
            setPendingParticipants(prev => prev.filter(p => p._id !== rejectModal.id));
            toast.success('Registration rejected');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Rejection failed');
        } finally {
            setActionLoading(null);
            // Reset modal state is redundant if I closed it earlier, but good for cleanup
            setRejectModal({ show: false, id: null, reason: '' });
        }
    };

    const filteredParticipants = pendingParticipants.filter(p =>
        p.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.prn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.transactionId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
                    Registration Approvals
                </h1>
                <p className="text-[var(--color-text-secondary)] mt-1">
                    Verify payments and approve event registrations
                </p>
            </div>

            {/* Search and Filters */}
            <Card className="p-4">
                <div className="relative">
                    <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-muted)] w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search by name, email, PRN or Transaction ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] focus:outline-none focus:ring-2 focus:ring-mindSaga-500"
                    />
                </div>
            </Card>

            {/* Grid of Pending Registrations */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <Card key={i} className="animate-pulse h-48 bg-[var(--color-bg-tertiary)]" />
                    ))}
                </div>
            ) : filteredParticipants.length === 0 ? (
                <Card className="p-12 text-center">
                    <MdCheckCircle className="w-16 h-16 text-status-available mx-auto mb-4 opacity-50" />
                    <p className="text-[var(--color-text-muted)] text-lg">
                        {searchTerm ? 'No pending registrations match your search.' : 'All clear! No pending registrations.'}
                    </p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {filteredParticipants.map((p, index) => (
                        <motion.div
                            key={p._id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card className="p-0 overflow-hidden flex flex-col sm:flex-row h-full">
                                {/* Payment Proof Preview */}
                                <div
                                    className="sm:w-48 h-48 sm:h-auto relative group cursor-pointer bg-black/20"
                                    onClick={() => setSelectedProof(p.paymentProofUrl)}
                                >
                                    <img
                                        src={p.paymentProofUrl}
                                        alt="Payment Proof"
                                        className="w-full h-full object-cover transition-smooth group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-smooth flex items-center justify-center">
                                        <MdRemoveRedEye className="text-white w-8 h-8" />
                                    </div>
                                    <div className="absolute top-2 left-2 bg-mindSaga-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                        Payment Proof
                                    </div>
                                </div>

                                {/* Info Section */}
                                <div className="flex-1 p-5 flex flex-col">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="text-lg font-bold text-[var(--color-text-primary)] leading-tight">
                                                {p.fullName}
                                            </h3>
                                            <p className="text-sm text-[var(--color-text-muted)]">{p.email}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-[var(--color-text-muted)] uppercase font-semibold">PRN</p>
                                            <p className="text-sm text-mindSaga-400 font-mono">{p.prn}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs mb-4">
                                        <div>
                                            <p className="text-[var(--color-text-muted)] uppercase font-semibold mb-0.5">Mobile</p>
                                            <p className="text-[var(--color-text-primary)]">{p.mobile}</p>
                                        </div>
                                        <div>
                                            <p className="text-[var(--color-text-muted)] uppercase font-semibold mb-0.5">Transaction ID</p>
                                            <p className="text-status-available font-mono">{p.transactionId}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-[var(--color-text-muted)] uppercase font-semibold mb-0.5">Events</p>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {p.registeredSubEvents?.map(e => (
                                                    <span key={e._id} className="px-2 py-0.5 rounded bg-mindSaga-500/10 text-mindSaga-400 border border-mindSaga-500/20">
                                                        {e.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="mt-auto flex gap-2 pt-4 border-t border-[var(--glass-border)]">
                                        <Button
                                            variant="success"
                                            className="flex-1 text-sm py-2"
                                            onClick={() => handleApprove(p._id)}
                                            loading={actionLoading === p._id}
                                        >
                                            <MdCheckCircle className="w-4 h-4" />
                                            Approve
                                        </Button>
                                        <Button
                                            variant="danger"
                                            className="flex-1 text-sm py-2"
                                            onClick={() => handleReject(p._id)}
                                            disabled={actionLoading === p._id}
                                        >
                                            <MdCancel className="w-4 h-4" />
                                            Reject
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* Image Modal */}
            <AnimatePresence>
                {selectedProof && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
                        onClick={() => setSelectedProof(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-xl shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <img
                                src={selectedProof}
                                alt="Full Proof"
                                className="w-full h-full object-contain"
                            />
                            <button
                                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-smooth"
                                onClick={() => setSelectedProof(null)}
                            >
                                <MdCancel className="w-6 h-6" />
                            </button>
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                                <a
                                    href={selectedProof}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-6 py-2 rounded-full bg-mindSaga-600 text-white font-medium flex items-center gap-2 hover:bg-mindSaga-500 transition-smooth"
                                >
                                    <FiExternalLink />
                                    Open in New Tab
                                </a>
                            </div>
                        </motion.div>
                    </motion.div>
                )}


                {/* Rejection Modal */}
                <ConfirmationModal
                    isOpen={rejectModal.show}
                    onClose={() => setRejectModal({ show: false, id: null, reason: '' })}
                    onConfirm={confirmReject}
                    title="Reject Registration"
                    message="Are you sure you want to reject this registration? This action cannot be undone."
                    confirmText="Reject Registration"
                    type="danger"
                >
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                            Reason for Rejection *
                        </label>
                        <textarea
                            value={rejectModal.reason}
                            onChange={(e) => setRejectModal(prev => ({ ...prev, reason: e.target.value }))}
                            placeholder="e.g. Invalid payment proof, Duplicate entry..."
                            className="w-full h-24 px-4 py-3 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--input-text)] focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-smooth resize-none"
                        />
                    </div>
                </ConfirmationModal>
            </AnimatePresence>
        </div >
    );
};

export default RegistrationsPage;
