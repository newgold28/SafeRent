import React, { useState, useEffect } from 'react';
import { PlusCircle, Bell, X, ShieldAlert, CheckCircle, Clock, Loader } from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import PropertyUpload from '../components/PropertyUpload';
import BookingManagement from '../components/BookingManagement';
import LandlordVerification from '../components/LandlordVerification';

const LandlordDashboard = () => {
    const [showUpload, setShowUpload] = useState(false);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const auth = getAuth();
    const db = getFirestore();

    useEffect(() => {
        if (!auth.currentUser) return;

        const unsubscribe = onSnapshot(doc(db, 'users', auth.currentUser.uid), (doc) => {
            if (doc.exists()) {
                setUserProfile(doc.data());
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [auth.currentUser]);

    if (loading) return (
        <div className="container section text-center" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="loading-spinner" />
            <p className="text-light">Loading your dashboard...</p>
        </div>
    );

    // 1. If no verification status or explicitly rejected, show verification form
    if (!userProfile?.verificationStatus || userProfile.verificationStatus === 'rejected') {
        return (
            <div className="container section">
                <motion.div
                    className="card mb-8"
                    style={{
                        background: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)',
                        border: '2px solid var(--primary-color)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                    }}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <ShieldAlert size={24} className="text-primary" style={{ flexShrink: 0 }} />
                    <div>
                        <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Account Verification Required</strong>
                        <p className="text-sm text-light" style={{ margin: 0 }}>To start listing properties and accepting bookings, please complete your identity verification below.</p>
                    </div>
                </motion.div>
                <LandlordVerification />
            </div>
        );
    }

    // 2. If pending, show info message
    if (userProfile.verificationStatus === 'pending') {
        return (
            <div className="container section text-center" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    style={{ maxWidth: '500px' }}
                >
                    <div style={{
                        width: '100px',
                        height: '100px',
                        background: 'var(--primary-light)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 2rem auto'
                    }}>
                        <Clock size={48} className="text-primary" />
                    </div>
                    <h2>Verification in Progress</h2>
                    <p className="text-light">
                        Your documents and identity video are currently being reviewed by our team.
                        You will gain access to your dashboard once your account is approved.
                    </p>
                </motion.div>
            </div>
        );
    }

    // 3. If approved, show full dashboard
    return (
        <div className="container section">
            <motion.div
                className="flex justify-between items-center mb-8"
                style={{ flexWrap: 'wrap', gap: '1rem' }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <div className="flex items-center gap-3">
                    <h2 style={{ margin: 0 }}>Landlord Dashboard</h2>
                    <span style={{
                        fontSize: '0.75rem',
                        backgroundColor: '#ECFDF5',
                        color: '#059669',
                        padding: '0.35rem 0.85rem',
                        borderRadius: '50px',
                        border: '1px solid #A7F3D0',
                        fontWeight: '700',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        <CheckCircle size={12} /> Verified
                    </span>
                </div>
                <motion.button
                    className="btn btn-primary flex items-center gap-4"
                    onClick={() => setShowUpload(!showUpload)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                >
                    {showUpload ? <X size={20} /> : <PlusCircle size={20} />}
                    {showUpload ? 'Cancel Upload' : 'Upload Property'}
                </motion.button>
            </motion.div>

            <AnimatePresence mode="wait">
                {showUpload ? (
                    <motion.div
                        key="upload"
                        className="mb-8"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <PropertyUpload />
                    </motion.div>
                ) : (
                    <motion.div
                        key="dashboard"
                        className="flex gap-8"
                        style={{ flexWrap: 'wrap' }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* Booking Requests */}
                        <div style={{ flex: '1 1 400px' }}>
                            <BookingManagement />
                        </div>

                        {/* Uploaded Properties */}
                        <div className="card" style={{ flex: '2 1 500px' }}>
                            <h3 className="mb-4">My Properties</h3>
                            <div className="flex flex-col gap-4">
                                {/* In a real app, this would be a map of actual data */}
                                <div className="card shadow-none" style={{ border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <strong style={{ display: 'block' }}>123 Tech Avenue</strong>
                                        <span className="text-xs text-light">Ibadan, Nigeria</span>
                                    </div>
                                    <div style={{
                                        color: '#059669',
                                        fontWeight: 'bold',
                                        fontSize: '0.85rem',
                                        backgroundColor: '#ECFDF5',
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '50px'
                                    }}>Active — 1 Booking</div>
                                </div>
                                <div className="card shadow-none" style={{ border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <strong style={{ display: 'block' }}>456 Uni Street</strong>
                                        <span className="text-xs text-light">Ibadan, Nigeria</span>
                                    </div>
                                    <div style={{
                                        color: 'var(--text-light)',
                                        fontWeight: 'bold',
                                        fontSize: '0.85rem',
                                        backgroundColor: 'var(--background-light)',
                                        padding: '0.25rem 0.75rem',
                                        borderRadius: '50px'
                                    }}>Unlisted</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LandlordDashboard;
