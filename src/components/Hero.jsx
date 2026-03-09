import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Shield, Users, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';

const Hero = () => {
    return (
        <section className="section" style={{
            background: 'linear-gradient(135deg, #FFFDF5 0%, #FFFFFF 100%)',
            overflow: 'hidden',
            position: 'relative'
        }}>
            {/* Decorative elements */}
            <div style={{
                position: 'absolute',
                top: '-100px',
                right: '-100px',
                width: '400px',
                height: '400px',
                background: 'var(--primary-light)',
                borderRadius: '50%',
                opacity: 0.3,
                filter: 'blur(80px)',
                zIndex: 0
            }} />

            <div className="container flex flex-col items-center" style={{ position: 'relative', zIndex: 1 }}>
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="badge mb-4"
                >
                    📍 Now Live in Ibadan!
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-center"
                    style={{ maxWidth: '900px' }}
                >
                    Find Your Perfect Student Home <span className="text-primary">Safely.</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="text-center"
                    style={{ maxWidth: '650px' }}
                >
                    The #1 verified marketplace for student housing in Ibadan.
                    Search verified listings, find reliable roommates, and pay securely via escrow.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="flex gap-4"
                >
                    <Link to="/signup" className="btn btn-primary shadow-lg">
                        Get Started Free
                    </Link>
                    <Link to="/search" className="btn btn-secondary">
                        <Search size={20} /> Browse Listings
                    </Link>
                </motion.div>

                {/* Social Proof / Features */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 0.8 }}
                    className="flex gap-8 mt-4"
                    style={{ marginTop: '4rem', opacity: 0.7 }}
                >
                    <div className="flex items-center gap-2 text-sm font-bold">
                        <Shield size={18} className="text-primary" /> Verified Landlords
                    </div>
                    <div className="flex items-center gap-2 text-sm font-bold">
                        <CreditCard size={18} className="text-primary" /> Escrow Payments
                    </div>
                    <div className="flex items-center gap-2 text-sm font-bold">
                        <Users size={18} className="text-primary" /> Roommate Finder
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

export default Hero;
