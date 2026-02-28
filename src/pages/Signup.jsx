import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { firebaseAuth } from '../services/firebase';
import { motion } from 'framer-motion';
import { UserPlus } from 'lucide-react';

const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState('student');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');

        // Frontend validation
        if (!email || !password || !confirmPassword) {
            setError('Please fill in all fields.');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            const { user } = await firebaseAuth.signUp(email, password, role);

            // Role-based redirection
            if (user.role === 'landlord') {
                navigate('/landlord-dashboard');
            } else {
                navigate('/student-dashboard');
            }
        } catch (err) {
            console.error("Signup Error:", err);
            // Map Firebase errors to user-friendly messages
            let message = 'Failed to create an account. Please try again.';
            if (err.code === 'auth/email-already-in-use') {
                message = 'This email is already in use by another account.';
            } else if (err.code === 'auth/invalid-email') {
                message = 'Please enter a valid email address.';
            } else if (err.code === 'auth/weak-password') {
                message = 'Your password is too weak.';
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
                        <UserPlus size={28} color="var(--text-dark)" />
                    </div>
                    <h2 style={{ marginBottom: '0.5rem' }}>Join Saferent</h2>
                    <p className="text-light text-sm" style={{ margin: 0 }}>Create your free account in seconds</p>
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

                <form onSubmit={handleSignup}>
                    {/* Role Selector */}
                    <div className="form-group">
                        <label className="form-label">I am a...</label>
                        <div className="flex gap-4">
                            {[
                                { value: 'student', label: '🎓 Student', sublabel: 'Looking for housing' },
                                { value: 'landlord', label: '🏠 Landlord', sublabel: 'Listing property' }
                            ].map((opt) => (
                                <div
                                    key={opt.value}
                                    onClick={() => !loading && setRole(opt.value)}
                                    style={{
                                        flex: 1,
                                        padding: '1rem',
                                        borderRadius: 'var(--radius-md)',
                                        border: `2px solid ${role === opt.value ? 'var(--primary-color)' : 'var(--border-color)'}`,
                                        backgroundColor: role === opt.value ? 'var(--primary-light)' : 'var(--background-light)',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.3s ease',
                                        textAlign: 'center'
                                    }}
                                >
                                    <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>{opt.label.split(' ')[0]}</div>
                                    <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>{opt.label.split(' ').slice(1).join(' ')}</div>
                                    <div className="text-xs text-light" style={{ marginTop: '0.25rem' }}>{opt.sublabel}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input
                            type="email"
                            className="form-input"
                            placeholder="your@email.com"
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
                            placeholder="Minimum 6 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Confirm Password</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
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
                                Creating Account...
                            </span>
                        ) : 'Create Account'}
                    </button>
                </form>
                <p className="text-center mt-4 text-sm">
                    Already have an account?{' '}
                    <Link to="/login" style={{ color: 'var(--primary-hover)', fontWeight: '700', textDecoration: 'none' }}>
                        Sign in
                    </Link>
                </p>
            </motion.div>
        </div>
    );
};

export default Signup;
