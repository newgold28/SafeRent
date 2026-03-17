import React, { useState, useEffect } from 'react';
import { getFirestore, collection, onSnapshot, query, where, doc, updateDoc, getDocs } from 'firebase/firestore';
import { CheckCircle, XCircle, User, Home, MapPin, Video, Eye, ExternalLink, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createNotification } from '../services/notifications';

const AdminDashboard = () => {
    const [pendingLandlords, setPendingLandlords] = useState([]);
    const [pendingProperties, setPendingProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLandlord, setSelectedLandlord] = useState(null);

    const db = getFirestore();

    useEffect(() => {
        // Fetch pending landlords
        const qUsers = query(collection(db, 'users'), where('verificationStatus', '==', 'pending'));
        const unsubscribeUsers = onSnapshot(qUsers, (snapshot) => {
            const users = [];
            snapshot.forEach((doc) => users.push({ id: doc.id, ...doc.data() }));
            setPendingLandlords(users);
            setLoading(false);
        });

        // Fetch pending properties
        const qProps = query(collection(db, 'properties'), where('approvalStatus', '==', 'pending'));
        const unsubscribeProps = onSnapshot(qProps, (snapshot) => {
            const props = [];
            snapshot.forEach((doc) => props.push({ id: doc.id, ...doc.data() }));
            setPendingProperties(props);
        });

        return () => {
            unsubscribeUsers();
            unsubscribeProps();
        };
    }, []);

    const handleStatusUpdate = async (type, id, status) => {
        try {
            const docRef = doc(db, type === 'landlord' ? 'users' : 'properties', id);
            await updateDoc(docRef, {
                [type === 'landlord' ? 'verificationStatus' : 'approvalStatus']: status,
                reviewedAt: new Date().toISOString()
            });

            // If landlord status changed, sync to ALL their properties for efficient filtering
            if (type === 'landlord') {
                const q = query(collection(db, 'properties'), where('landlordId', '==', id));
                const snapshot = await getDocs(query(collection(db, 'properties'), where('landlordId', '==', id)));
                const batchPromises = snapshot.docs.map(propDoc =>
                    updateDoc(doc(db, 'properties', propDoc.id), {
                        landlordVerified: status === 'approved'
                    })
                );
                await Promise.all(batchPromises);
            }

            if (selectedLandlord?.id === id) setSelectedLandlord(null);

            // Send real-time notification
            if (type === 'landlord') {
                const title = status === 'approved' ? 'Account Verified! ✨' : 'Verification Update';
                const message = status === 'approved'
                    ? 'Congratulations! Your identity has been verified. You can now start listing properties and accepting bookings.'
                    : 'Your verification request could not be approved at this time. Please ensure your documents and video are clear and try again.';
                await createNotification(id, title, message, 'verification_status', id);
            } else if (type === 'property') {
                const prop = pendingProperties.find(p => p.id === id);
                if (prop) {
                    const title = status === 'approved' ? 'Property Live! 🏠' : 'Property Listing Update';
                    const message = status === 'approved'
                        ? `Great news! Your property "${prop.title}" has been approved and is now visible to students.`
                        : `Your property listing "${prop.title}" was not approved. Please review the listing details and try again.`;
                    await createNotification(prop.landlordId, title, message, 'property_approval', id);
                }
            }

            alert(`${type.charAt(0).toUpperCase() + type.slice(1)} ${status}!`);
        } catch (err) {
            console.error("Action error:", err);
            alert("Action failed.");
        }
    };

    if (loading) return (
        <div className="container section text-center" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="loading-spinner" />
            <p className="text-light">Loading Admin Panel...</p>
        </div>
    );

    return (
        <div className="container section">
            <motion.div
                className="flex items-center gap-3 mb-8"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
            >
                <div style={{
                    width: '48px',
                    height: '48px',
                    background: 'var(--primary-color)',
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Shield size={24} color="var(--text-dark)" />
                </div>
                <div>
                    <h2 style={{ margin: 0 }}>Admin Review Dashboard</h2>
                    <p className="text-sm text-light" style={{ margin: 0 }}>Manage landlord verifications and property approvals</p>
                </div>
            </motion.div>

            <div className="grid gap-8" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))' }}>

                {/* Pending Landlords List */}
                <motion.div
                    className="card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    <h3 className="mb-4 flex items-center gap-2">
                        <User size={20} className="text-primary" />
                        Pending Landlords
                        <span className="badge" style={{ marginLeft: 'auto' }}>{pendingLandlords.length}</span>
                    </h3>
                    <div className="flex flex-col gap-3">
                        {pendingLandlords.length === 0 ? <p className="text-light">No pending verifications.</p> :
                            pendingLandlords.map(user => (
                                <motion.div
                                    key={user.id}
                                    className="card shadow-none flex justify-between items-center cursor-pointer"
                                    style={{
                                        border: `2px solid ${selectedLandlord?.id === user.id ? 'var(--primary-color)' : 'var(--border-color)'}`,
                                        backgroundColor: selectedLandlord?.id === user.id ? 'var(--primary-light)' : 'var(--background-white)',
                                        padding: '1rem 1.25rem',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onClick={() => setSelectedLandlord(user)}
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                >
                                    <div>
                                        <div style={{ fontWeight: '700' }}>{user.email}</div>
                                        <div className="text-xs text-light">NIN: {user.nin || 'Not provided'}</div>
                                    </div>
                                    <Eye size={18} className="text-light" />
                                </motion.div>
                            ))}
                    </div>
                </motion.div>

                {/* Pending Properties List */}
                <motion.div
                    className="card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <h3 className="mb-4 flex items-center gap-2">
                        <Home size={20} className="text-primary" />
                        Pending Properties
                        <span className="badge" style={{ marginLeft: 'auto' }}>{pendingProperties.length}</span>
                    </h3>
                    <div className="flex flex-col gap-3">
                        {pendingProperties.length === 0 ? <p className="text-light">No pending listings.</p> :
                            pendingProperties.map(prop => (
                                <motion.div
                                    key={prop.id}
                                    className="card shadow-none"
                                    style={{ border: '1px solid var(--border-color)', padding: '1rem 1.25rem' }}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div style={{ fontWeight: '700' }}>{prop.title}</div>
                                            <div className="text-xs text-light">{prop.location}</div>
                                        </div>
                                        <div style={{ fontWeight: '800', color: 'var(--primary-hover)', fontSize: '1rem' }}>₦{prop.price?.toLocaleString()}</div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            className="btn flex-1 text-sm"
                                            style={{
                                                backgroundColor: '#FEE2E2',
                                                color: '#DC2626',
                                                padding: '0.5rem',
                                                border: 'none'
                                            }}
                                            onClick={() => handleStatusUpdate('property', prop.id, 'rejected')}
                                        >
                                            <XCircle size={14} /> Reject
                                        </button>
                                        <button
                                            className="btn btn-primary flex-1 text-sm"
                                            style={{ padding: '0.5rem' }}
                                            onClick={() => handleStatusUpdate('property', prop.id, 'approved')}
                                        >
                                            <CheckCircle size={14} /> Approve
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                    </div>
                </motion.div>
            </div>

            {/* Verification Detail View */}
            <AnimatePresence>
                {selectedLandlord && (
                    <motion.div
                        className="card mt-8"
                        style={{ border: '2px solid var(--primary-color)' }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="flex justify-between items-center mb-6" style={{ flexWrap: 'wrap', gap: '1rem' }}>
                            <h3 style={{ margin: 0 }}>Review: {selectedLandlord.email}</h3>
                            <button className="btn btn-secondary" style={{ padding: '0.5rem 1.25rem' }} onClick={() => setSelectedLandlord(null)}>Close Review</button>
                        </div>

                        <div className="grid gap-8" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
                            {/* Identity Video */}
                            <div>
                                <h4 className="mb-2 flex items-center gap-2"><Video size={16} /> Verification Video</h4>
                                <div style={{ aspectRatio: '16/9', backgroundColor: 'var(--text-dark)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                                    <video src={selectedLandlord.videoUrl} controls style={{ width: '100%', height: '100%' }} />
                                </div>
                                <div className="card shadow-none mt-4" style={{ border: '1px solid var(--border-color)', padding: '1rem' }}>
                                    <div className="flex items-center gap-2 mb-2 text-sm">
                                        <MapPin size={14} className="text-primary" />
                                        <strong>GPS:</strong> {selectedLandlord.gpsLatitude}, {selectedLandlord.gpsLongitude}
                                    </div>
                                    <a
                                        href={`https://www.google.com/maps?q=${selectedLandlord.gpsLatitude},${selectedLandlord.gpsLongitude}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex items-center gap-1 text-sm"
                                        style={{ color: 'var(--primary-hover)', fontWeight: '700', textDecoration: 'none' }}
                                    >
                                        View on Map <ExternalLink size={12} />
                                    </a>
                                </div>
                            </div>

                            {/* Documents */}
                            <div className="flex flex-col gap-4">
                                <h4 style={{ margin: 0 }}>Identification Documents</h4>
                                <div className="grid gap-3" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                                    <a href={selectedLandlord.ninImage} target="_blank" rel="noreferrer" className="card shadow-none text-center block" style={{ border: '1px solid var(--border-color)', padding: '0.75rem', textDecoration: 'none', color: 'var(--text-dark)' }}>
                                        <div className="text-xs text-light mb-1">NIN Proof</div>
                                        <img src={selectedLandlord.ninImage} alt="NIN" style={{ width: '100%', height: '70px', objectFit: 'cover', borderRadius: '8px' }} />
                                    </a>
                                    <a href={selectedLandlord.licenseImage} target="_blank" rel="noreferrer" className="card shadow-none text-center block" style={{ border: '1px solid var(--border-color)', padding: '0.75rem', textDecoration: 'none', color: 'var(--text-dark)' }}>
                                        <div className="text-xs text-light mb-1">ID License</div>
                                        <img src={selectedLandlord.licenseImage} alt="License" style={{ width: '100%', height: '70px', objectFit: 'cover', borderRadius: '8px' }} />
                                    </a>
                                </div>
                                <a href={selectedLandlord.ownershipDoc} target="_blank" rel="noreferrer" className="btn btn-secondary w-full text-sm" style={{ textDecoration: 'none' }}>
                                    <Eye size={16} /> View Ownership Doc
                                </a>

                                <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.5rem 0' }} />

                                <div className="flex gap-4">
                                    <button
                                        className="btn flex-1 flex items-center justify-center gap-2"
                                        style={{ backgroundColor: '#FEE2E2', color: '#DC2626', border: 'none' }}
                                        onClick={() => handleStatusUpdate('landlord', selectedLandlord.id, 'rejected')}
                                    >
                                        <XCircle size={18} /> Reject
                                    </button>
                                    <button
                                        className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                                        onClick={() => handleStatusUpdate('landlord', selectedLandlord.id, 'approved')}
                                    >
                                        <CheckCircle size={18} /> Approve & Verify
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminDashboard;
