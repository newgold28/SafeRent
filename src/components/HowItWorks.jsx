import React from 'react';
import { Search, ShieldCheck, Home } from 'lucide-react';
import { motion } from 'framer-motion';

const HowItWorks = () => {
    const steps = [
        {
            icon: <Search size={32} />,
            title: '1. Browse & Match',
            desc: 'Discover verified listings or the perfect roommate based on your lifestyle and preferences.'
        },
        {
            icon: <ShieldCheck size={32} />,
            title: '2. Secure Booking',
            desc: 'Pay with absolute peace of mind. Your funds are held in secure escrow until you move in.'
        },
        {
            icon: <Home size={32} />,
            title: '3. Move In',
            desc: 'Get your keys and settle into your new home. Stress-free transition, guaranteed.'
        },
    ];

    return (
        <section className="section bg-white">
            <div className="container">
                <div className="text-center mb-8">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        How Saferent Works
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        style={{ maxWidth: '650px', margin: '0 auto' }}
                    >
                        We've built Nigeria's first fully verified marketplace to make student housing
                        simple, transparent, and completely scam-free.
                    </motion.p>
                </div>

                <div className="grid" style={{
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '2.5rem',
                    marginTop: '4rem'
                }}>
                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            className="card text-center"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                        >
                            <div style={{
                                color: 'var(--text-dark)',
                                backgroundColor: 'var(--primary-color)',
                                width: '70px',
                                height: '70px',
                                borderRadius: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 2rem auto',
                                boxShadow: '0 8px 20px -5px rgba(255, 193, 7, 0.4)'
                            }}>
                                {step.icon}
                            </div>
                            <h3 className="mb-4">{step.title}</h3>
                            <p className="text-sm" style={{ marginBottom: 0 }}>{step.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HowItWorks;
