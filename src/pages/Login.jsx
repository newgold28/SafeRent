import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { firebaseAuth } from '../services/firebase';
import { motion } from 'framer-motion';
import { LogIn } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        // Basic frontend validation
        if (!email || !password) {
            setError('Please fill in all fields.');
            return;
        }

        setLoading(true);
        try {
            const { user } = await firebaseAuth.signIn(email, password);

            // Role-based redirection
            if (user.role === 'landlord') {
                navigate('/landlord-dashboard');
            } else {
                navigate('/student-dashboard');
            }
        } catch (err) {
            console.error("Login Error:", err);
            // Map Firebase errors to user-friendly messages
            let message = 'Failed to log in. Please check your credentials.';
            if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                message = 'Invalid email or password.';
            } else if (err.code === 'auth/invalid-email') {
                message = 'Please enter a valid email address.';
            }
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="section" style={{
            minHeight: '80vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #FFFDF5 0%, #FFF8E1 100%)'
        }}>
            <motion.div
                className="card"
                style={{ maxWidth: '440px', width: '100%', padding: '3rem' }}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="text-center mb-8">
                    <div style={{
                        width: '60px',
                        height: '60px',
                        background: 'var(--primary-color)',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem auto',
                        boxShadow: '0 8px 20px -5px rgba(255, 193, 7, 0.3)'
                    }}>
                        <LogIn size={28} color="var(--text-dark)" />
                    </div>
                    <h2 style={{ marginBottom: '0.5rem' }}>Welcome Back</h2>
                    <p className="text-light text-sm" style={{ margin: 0 }}>Sign in to your Saferent account</p>
                </div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{
                            backgroundColor: '#FEF2F2',
                            color: '#DC2626',
                            padding: '1rem',
                            borderRadius: 'var(--radius-md)',
                            marginBottom: '2rem',
                            textAlign: 'center',
                            fontWeight: '600',
                            fontSize: '0.9rem',
                            border: '1px solid #FEE2E2'
                        }}
                    >
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            className="form-input"
                            placeholder="you@university.edu"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary w-full text-center justify-center"
                        disabled={loading}
                        style={{ padding: '1rem', fontSize: '1rem' }}
                    >
                        {loading ? (
                            <span className="flex items-center gap-2 justify-center">
                                <span className="loading-spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
                                Signing in...
                            </span>
                        ) : 'Login'}
                    </button>
                </form>
                <p className="text-center mt-4 text-sm">
                    Don't have an account?{' '}
                    <Link to="/signup" style={{ color: 'var(--primary-hover)', fontWeight: '700', textDecoration: 'none' }}>
                        Create one free
                    </Link>
                </p>
            </motion.div>
        </div>
    );
};

export default Login;
