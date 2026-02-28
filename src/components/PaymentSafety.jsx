import React from 'react';
import { Lock, ShieldCheck, CreditCard, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

const PaymentSafety = () => {
    return (
        <section className="section bg-white">
            <div className="container flex items-center justify-between" style={{ flexWrap: 'wrap-reverse', gap: '4rem' }}>
                <motion.div
                    className="card"
                    style={{
                        flex: '1 1 400px',
                        backgroundColor: 'var(--text-dark)',
                        color: 'white',
                        padding: '4rem 3rem',
                        textAlign: 'center',
                        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)'
                    }}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <div style={{
                        width: '80px',
                        height: '80px',
                        background: 'var(--primary-color)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 2rem auto',
                        boxShadow: '0 0 30px rgba(255, 193, 7, 0.3)'
                    }}>
                        <Lock size={40} color="var(--text-dark)" />
                    </div>
                    <h3 style={{ color: 'white', marginBottom: '1.5rem', fontSize: '1.75rem' }}>100% Secure Escrow</h3>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem', lineHeight: '1.8' }}>
                        Your rent is held safely in our Paystack-managed escrow.
                        The landlord only receives the funds after you have successfully
                        moved in and confirmed the property status.
                    </p>
                </motion.div>

                <motion.div
                    style={{ flex: '1 1 450px' }}
                    initial={{ opacity: 0, x: 30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <h2 className="mb-6">Zero Risk. Total Peace of Mind.</h2>
                    <p style={{ fontSize: '1.1rem', marginBottom: '2.5rem' }}>
                        We've completely eliminated the risk of housing scams in Ibadan.
                        By protecting your money every step of the way, we ensure you only
                        pay for what you actually get.
                    </p>

                    <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        {[
                            { icon: <ShieldCheck className="text-primary" />, text: 'Anti-Scam Protection' },
                            { icon: <CreditCard className="text-primary" />, text: 'Paystack Integrated' },
                            { icon: <RefreshCw className="text-primary" />, text: 'Guaranteed Refunds' },
                            { icon: <Lock className="text-primary" />, text: 'Encrypted Data' }
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-3 font-bold text-dark">
                                {item.icon}
                                <span style={{ fontSize: '0.9rem' }}>{item.text}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default PaymentSafety;
