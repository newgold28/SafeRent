import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { motion } from 'framer-motion';

const Navbar = () => {
    return (
        <nav className="navbar-sticky">
            <div className="container flex justify-between items-center">
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-dark)' }}>
                        <div style={{ padding: '8px', backgroundColor: 'var(--primary-color)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Home size={24} color="var(--text-dark)" />
                        </div>
                        <span style={{ fontWeight: '800', fontSize: '1.5rem', letterSpacing: '-0.025em' }}>Saferent</span>
                    </Link>
                </motion.div>

                <div className="flex gap-8 items-center">
                    <Link to="/" className="nav-link">Home</Link>
                    <div className="flex gap-4">
                        <Link to="/login" className="btn btn-secondary" style={{ padding: '0.6rem 1.5rem' }}>Login</Link>
                        <Link to="/signup" className="btn btn-primary" style={{ padding: '0.6rem 1.5rem' }}>Get Started</Link>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
