import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

const Footer = () => {
    return (
        <footer style={{
            backgroundColor: 'var(--text-dark)',
            color: 'white',
            padding: '4rem 0 2rem',
            marginTop: 'auto'
        }}>
            <div className="container flex justify-between" style={{ flexWrap: 'wrap', gap: '3rem' }}>
                <div style={{ flex: '1 1 300px' }}>
                    <div className="flex items-center gap-2 mb-4">
                        <div style={{
                            padding: '6px',
                            backgroundColor: 'var(--primary-color)',
                            borderRadius: '10px',
                            display: 'flex'
                        }}>
                            <Home size={20} color="var(--text-dark)" />
                        </div>
                        <span style={{ fontWeight: '800', fontSize: '1.4rem' }}>Saferent</span>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.5)', maxWidth: '300px', fontSize: '0.95rem' }}>
                        The safest way for students to find verified housing and trusted roommates in Ibadan.
                    </p>
                </div>
                <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
                    <div className="flex flex-col gap-4">
                        <h4 style={{ color: 'var(--primary-color)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Company</h4>
                        <Link to="/about" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}>About Us</Link>
                        <Link to="/contact" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}>Contact</Link>
                    </div>
                    <div className="flex flex-col gap-4">
                        <h4 style={{ color: 'var(--primary-color)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Legal</h4>
                        <Link to="/privacy" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}>Privacy Policy</Link>
                        <Link to="/terms" style={{ color: 'rgba(255,255,255,0.6)', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.3s' }}>Terms of Service</Link>
                    </div>
                </div>
            </div>
            <div className="container text-center mt-4" style={{
                borderTop: '1px solid rgba(255,255,255,0.08)',
                paddingTop: '2rem',
                marginTop: '3rem',
                color: 'rgba(255,255,255,0.4)',
                fontSize: '0.85rem'
            }}>
                &copy; {new Date().getFullYear()} Saferent. All rights reserved.
            </div>
        </footer>
    );
};

export default Footer;
