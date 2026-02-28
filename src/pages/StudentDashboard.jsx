import React from 'react';
import { motion } from 'framer-motion';
import { Clock, BookOpen, Users } from 'lucide-react';
import PropertyListings from '../components/PropertyListings';
import StudentBookings from '../components/StudentBookings';
import RoommateFinderWidget from '../components/RoommateFinderWidget';

const StudentDashboard = () => {
    return (
        <div className="container section">
            <motion.h2
                className="mb-8"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
            >
                Student Dashboard
            </motion.h2>

            <div className="flex gap-8 mb-12" style={{ flexWrap: 'wrap' }}>
                {/* Active Booking Countdown */}
                <motion.div
                    className="card text-center"
                    style={{
                        flex: '1 1 300px',
                        background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--primary-hover) 100%)',
                        color: 'var(--text-dark)',
                        border: 'none',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    whileHover={{ scale: 1.02 }}
                >
                    <div style={{
                        position: 'absolute',
                        top: '-30px',
                        right: '-30px',
                        width: '120px',
                        height: '120px',
                        background: 'rgba(255,255,255,0.15)',
                        borderRadius: '50%'
                    }} />
                    <Clock size={32} style={{ margin: '0 auto 1rem auto', opacity: 0.8 }} />
                    <h3 style={{ color: 'var(--text-dark)', marginBottom: '0.5rem' }}>Move-in Countdown</h3>
                    <div style={{ fontSize: '3.5rem', fontWeight: '800', letterSpacing: '-0.05em' }}>14 Days</div>
                    <p style={{ color: 'rgba(0,0,0,0.6)', fontSize: '0.9rem', margin: 0 }}>Until you move into 123 Tech Avenue</p>
                </motion.div>

                {/* Modular Bookings Component */}
                <StudentBookings />
            </div>

            <div style={{
                height: '1px',
                background: 'linear-gradient(to right, transparent, var(--border-color), transparent)',
                margin: '3rem 0'
            }} />

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
            >
                <div className="flex items-center gap-3 mb-4">
                    <BookOpen size={24} className="text-primary" />
                    <h2 style={{ margin: 0 }}>Available Properties</h2>
                </div>
                <PropertyListings />
            </motion.div>

            <div style={{
                height: '1px',
                background: 'linear-gradient(to right, transparent, var(--border-color), transparent)',
                margin: '3rem 0'
            }} />

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
            >
                <div className="flex items-center gap-3 mb-4">
                    <Users size={24} className="text-primary" />
                    <h2 style={{ margin: 0 }}>Find a Roommate</h2>
                </div>
                <RoommateFinderWidget />
            </motion.div>
        </div>
    );
};

export default StudentDashboard;
