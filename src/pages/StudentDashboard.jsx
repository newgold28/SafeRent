import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, BookOpen, Users, Star, ArrowRight, Home } from 'lucide-react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, onSnapshot, collection, query, where } from 'firebase/firestore';
import PropertyListings from '../components/PropertyListings';
import StudentBookings from '../components/StudentBookings';
import RoommateFinderWidget from '../components/RoommateFinderWidget';

const StudentDashboard = () => {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [activeBooking, setActiveBooking] = useState(null);
    const [loading, setLoading] = useState(true);

    const auth = getAuth();
    const db = getFirestore();

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            if (!currentUser) {
                setLoading(false);
                return;
            }

            // 1. Listen for user profile (to get name)
            const unsubProfile = onSnapshot(doc(db, 'users', currentUser.uid), (doc) => {
                if (doc.exists()) {
                    setUserProfile(doc.data());
                }
            });

            // 2. Listen for bookings to find the latest confirmed one
            const q = query(
                collection(db, 'bookings'),
                where('studentId', '==', currentUser.uid),
                where('status', '==', 'confirmed')
            );

            const unsubBookings = onSnapshot(q, (snapshot) => {
                const confirmedBookings = [];
                snapshot.forEach((doc) => {
                    confirmedBookings.push({ id: doc.id, ...doc.data() });
                });

                // Get the most recent confirmed booking
                if (confirmedBookings.length > 0) {
                    confirmedBookings.sort((a, b) => {
                        const timeA = a.createdAt?.seconds || new Date(a.createdAt).getTime() / 1000 || 0;
                        const timeB = b.createdAt?.seconds || new Date(b.createdAt).getTime() / 1000 || 0;
                        return timeB - timeA;
                    });
                    setActiveBooking(confirmedBookings[0]);
                } else {
                    setActiveBooking(null);
                }
                setLoading(false);
            });

            return () => {
                unsubProfile();
                unsubBookings();
            };
        });

        return () => unsubscribeAuth();
    }, [auth, db]);

    const calculateDaysRemaining = (createdAt) => {
        const moveInDate = new Date(createdAt);
        moveInDate.setDate(moveInDate.getDate() + 14); // Assume 14 days from booking as a mock
        const today = new Date();
        const diffTime = moveInDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    if (loading) {
        return (
            <div className="container section text-center" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="loading-spinner" />
            </div>
        );
    }

    const firstName = userProfile?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'Student';

    return (
        <div className="bg-premium min-h-screen">
            <div className="container section">
                {/* Greeting Section */}
                <motion.div
                    className="mb-12"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <h1 className="text-gradient mb-2" style={{ fontSize: '3rem' }}>Welcome back, {firstName}!</h1>
                    <p className="text-light">Your student housing journey, simplified and secured.</p>
                </motion.div>

                <div className="flex gap-8 mb-16" style={{ flexWrap: 'wrap' }}>
                    {/* Dynamic Countdown / Welcome Card */}
                    <AnimatePresence mode="wait">
                        {activeBooking ? (
                            <motion.div
                                key="countdown"
                                className="card glass-card relative overflow-hidden"
                                style={{ flex: '1 1 350px', border: 'none' }}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                whileHover={{ y: -5 }}
                            >
                                <div style={{ position: 'absolute', top: '-10%', right: '-10%', opacity: 0.1 }}>
                                    <Star size={180} color="var(--primary-color)" />
                                </div>
                                <div className="flex items-center gap-2 mb-4 text-primary fw-800">
                                    <Clock size={20} />
                                    <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Move-in Countdown</span>
                                </div>
                                <div className="tracking-tight fw-800 mb-2" style={{ fontSize: '4rem', color: 'var(--text-dark)' }}>
                                    {calculateDaysRemaining(activeBooking.createdAt)} Days
                                </div>
                                <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
                                    To your stay at <span className="text-primary">Property {activeBooking.propertyId.substring(0, 8)}</span>
                                </p>
                                <div className="mt-6 flex items-center gap-2 text-sm fw-800 cursor-pointer hover:gap-3 transition-all">
                                    View Move-in Package <ArrowRight size={16} />
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="welcome"
                                className="card relative overflow-hidden"
                                style={{
                                    flex: '1 1 350px',
                                    background: 'linear-gradient(135deg, #FFC107 0%, #FF9100 100%)',
                                    border: 'none',
                                    color: 'var(--text-dark)'
                                }}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileHover={{ y: -5 }}
                            >
                                <div className="flex items-center gap-3 mb-6">
                                    <div style={{ backgroundColor: 'rgba(0,0,0,0.1)', padding: '12px', borderRadius: '15px' }}>
                                        <Home size={28} />
                                    </div>
                                    <h3 style={{ margin: 0 }}>Start Your Journey</h3>
                                </div>
                                <p style={{ color: 'rgba(0,0,0,0.7)', fontSize: '1rem', fontWeight: 500 }}>
                                    You haven't secured a home yet. Browse verified listings to find your perfect stay.
                                </p>
                                <button
                                    className="btn w-full mt-4"
                                    style={{ backgroundColor: 'white', color: 'var(--text-dark)' }}
                                    onClick={() => document.getElementById('listings-section').scrollIntoView()}
                                >
                                    Browse Listings
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Modular Bookings Component */}
                    <div style={{ flex: '2 1 500px' }}>
                        <StudentBookings />
                    </div>
                </div>

                <div style={{ margin: '5rem 0' }}>
                    <div id="listings-section" className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <BookOpen size={28} className="text-primary" />
                            <h2 style={{ margin: 0 }} className="tracking-tight">Verified Properties</h2>
                        </div>
                        <div className="text-sm fw-800 text-primary cursor-pointer hover:underline">View All Map</div>
                    </div>
                    <PropertyListings />
                </div>

                <div style={{ margin: '5rem 0' }}>
                    <div className="flex items-center gap-3 mb-8">
                        <Users size={28} className="text-primary" />
                        <h2 style={{ margin: 0 }} className="tracking-tight">Find Your Roommate</h2>
                    </div>
                    <RoommateFinderWidget />
                </div>
            </div>
        </div>
    );
};

export default StudentDashboard;
