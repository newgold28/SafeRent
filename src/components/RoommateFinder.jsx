import React from 'react';
import { Users, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const RoommateFinder = () => {
    return (
        <section className="section" style={{ backgroundColor: 'var(--background-light)' }}>
            <div className="container flex items-center justify-between" style={{ flexWrap: 'wrap', gap: '4rem' }}>
                <motion.div
                    style={{ flex: '1 1 450px' }}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="mb-4">Find the Perfect Roommate</h2>
                    <p style={{ fontSize: '1.1rem', marginBottom: '2.5rem' }}>
                        Don't leave your living situation to chance. Our intelligent roommate matching
                        system pairs you with students who share your lifestyle, study habits,
                        and cleanliness standards.
                    </p>
                    <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {[
                            'Detailed Compatibility Profiles',
                            'Verified Student Status Only',
                            'Secure In-App Chatting'
                        ].map((item, i) => (
                            <li key={i} className="flex items-center gap-4 font-bold text-dark">
                                <CheckCircle size={24} className="text-primary" /> {item}
                            </li>
                        ))}
                    </ul>
                </motion.div>

                <motion.div
                    className="card"
                    style={{
                        flex: '1 1 400px',
                        textAlign: 'center',
                        background: 'var(--background-white)',
                        padding: '4rem 3rem',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '6px',
                        background: 'var(--primary-color)'
                    }} />

                    <div style={{ fontSize: '4.5rem', marginBottom: '1.5rem' }}>🤝</div>
                    <h3 className="mb-6">Join 5,000+ Students looking for roommates.</h3>
                    <p className="text-sm mb-8">Build your profile once and connect with like-minded students in Ibadan.</p>
                    <button className="btn btn-primary w-full shadow-lg">Create Your Member Profile</button>
                    <p className="text-xs mt-4 text-light">100% Free for Students</p>
                </motion.div>
            </div>
        </section>
    );
};

export default RoommateFinder;
