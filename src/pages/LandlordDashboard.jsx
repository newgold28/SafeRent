import React, { useState, useEffect } from 'react';
import { PlusCircle, Bell, X, ShieldAlert, CheckCircle, Clock, Loader, TrendingUp, Home, DollarSign, Users, MapPin } from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, onSnapshot, collection, query, where, orderBy } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import PropertyUpload from '../components/PropertyUpload';
import BookingManagement from '../components/BookingManagement';
import LandlordVerification from '../components/LandlordVerification';

const LandlordDashboard = () => {
    const [showUpload, setShowUpload] = useState(false);
    const [userProfile, setUserProfile] = useState(null);
    const [properties, setProperties] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    const auth = getAuth();
    const db = getFirestore();

    useEffect(() => {
        if (!auth.currentUser) return;

        // 1. Listen for user profile
        const unsubProfile = onSnapshot(doc(db, 'users', auth.currentUser.uid), (doc) => {
            if (doc.exists()) {
                setUserProfile(doc.data());
            }
        });

        // 2. Listen for landlord's properties
        const qProps = query(
            collection(db, 'properties'),
            where('landlordId', '==', auth.currentUser.uid)
        );
        const unsubProps = onSnapshot(qProps, (snapshot) => {
            const props = [];
            snapshot.forEach((doc) => {
                props.push({ id: doc.id, ...doc.data() });
            });
            // Client-side sort: newest first
            props.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setProperties(props);
        });

        // 3. Listen for landlord's bookings (for analytics)
        const qBookings = query(
            collection(db, 'bookings'),
            where('landlordId', '==', auth.currentUser.uid)
        );
        const unsubBookings = onSnapshot(qBookings, (snapshot) => {
            const bks = [];
            snapshot.forEach((doc) => {
                bks.push({ id: doc.id, ...doc.data() });
            });
            setBookings(bks);
            setLoading(false); // Only set loading false once we have profile and initial data
        }, (error) => {
            console.error("Error fetching dashboard data:", error);
            setLoading(false);
        });

        return () => {
            unsubProfile();
            unsubProps();
            unsubBookings();
        };
    }, [auth.currentUser]);

    const stats = {
        totalProperties: properties.length,
        pendingBookings: bookings.filter(b => b.status === 'pending').length,
        activeTenants: bookings.filter(b => b.status === 'confirmed').length,
        totalEarnings: bookings
            .filter(b => b.status === 'confirmed')
            .reduce((sum, b) => sum + Number(b.amount || 0), 0)
    };

    if (loading) return (
        <div className="container section text-center" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="loading-spinner" />
            <p className="text-light">Loading your dashboard...</p>
        </div>
    );

    // 1. If no verification status or explicitly rejected, show verification form (Bypass for test user)
    const isTestUser = auth.currentUser?.email === 'chidi@test.com';

    if ((!userProfile?.verificationStatus || userProfile.verificationStatus === 'rejected') && !isTestUser) {
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

    // 2. If pending, show info message (Bypass for test user)
    if (userProfile.verificationStatus === 'pending' && !isTestUser) {
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

            {/* Analytics Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="card shadow-sm p-4 flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-xl">
                        <Home size={24} className="text-primary" />
                    </div>
                    <div>
                        <div className="text-xs text-light mb-1 fw-bold uppercase px-0">Properties</div>
                        <div className="text-2xl fw-bold">{stats.totalProperties}</div>
                    </div>
                </div>
                <div className="card shadow-sm p-4 flex items-center gap-4">
                    <div className="p-3 bg-blue-50 rounded-xl">
                        <Clock size={24} className="text-blue-600" />
                    </div>
                    <div>
                        <div className="text-xs text-light mb-1 fw-bold uppercase px-0">Pending</div>
                        <div className="text-2xl fw-bold">{stats.pendingBookings}</div>
                    </div>
                </div>
                <div className="card shadow-sm p-4 flex items-center gap-4">
                    <div className="p-3 bg-green-50 rounded-xl">
                        <Users size={24} className="text-green-600" />
                    </div>
                    <div>
                        <div className="text-xs text-light mb-1 fw-bold uppercase px-0">Tenants</div>
                        <div className="text-2xl fw-bold">{stats.activeTenants}</div>
                    </div>
                </div>
                <div className="card shadow-sm p-4 flex items-center gap-4">
                    <div className="p-3 bg-amber-50 rounded-xl">
                        <DollarSign size={24} className="text-amber-600" />
                    </div>
                    <div>
                        <div className="text-xs text-light mb-1 fw-bold uppercase px-0">Earnings</div>
                        <div className="text-2xl fw-bold">₦{stats.totalEarnings.toLocaleString()}</div>
                    </div>
                </div>
            </div>

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
                            <BookingManagement properties={properties} />
                        </div>

                        <div className="card" style={{ flex: '2 1 500px' }}>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="m-0">My Properties</h3>
                                <span className="text-xs text-light uppercase fw-bold tracking-wider">{properties.length} Listings</span>
                            </div>
                            <div className="flex flex-col gap-4">
                                {properties.length === 0 ? (
                                    <div className="text-center py-12 border-2 border-dashed rounded-xl">
                                        <Home size={40} className="mx-auto text-light opacity-20 mb-3" />
                                        <p className="text-light m-0">No properties uploaded yet.</p>
                                    </div>
                                ) : (
                                    properties.map(prop => (
                                        <div key={prop.id} className="card shadow-none hover:bg-gray-50 transition-colors cursor-pointer" style={{ border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' }}>
                                            <div className="flex items-center gap-4">
                                                <div style={{ width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f3f4f6' }}>
                                                    {prop.images && prop.images[0] ? (
                                                        <img src={prop.images[0]} alt={prop.title} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-light">
                                                            <Home size={20} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <strong style={{ display: 'block', fontSize: '1rem' }}>{prop.title}</strong>
                                                    <span className="text-xs text-light flex items-center gap-1">
                                                        <MapPin size={12} /> {prop.location}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <div style={{
                                                    color: prop.approvalStatus === 'approved' ? '#059669' : '#D97706',
                                                    fontWeight: 'bold',
                                                    fontSize: '0.75rem',
                                                    backgroundColor: prop.approvalStatus === 'approved' ? '#ECFDF5' : '#FFFBEB',
                                                    padding: '0.25rem 0.65rem',
                                                    borderRadius: '50px',
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {prop.approvalStatus || 'Pending'}
                                                </div>
                                                <div className="text-[10px] fw-bold text-light uppercase">
                                                    ₦{Number(prop.price).toLocaleString()} / yr
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default LandlordDashboard;
