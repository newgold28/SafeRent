import React from 'react';
import { Link } from 'react-router-dom';
import { Home, LogOut, User as UserIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import NotificationDropdown from './NotificationDropdown';

const Navbar = () => {
    const [user, setUser] = React.useState(null);
    const auth = getAuth();
    const navigate = useNavigate();

    React.useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, [auth]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error("Error signing out: ", error);
        }
    };

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

                    {user ? (
                        <div className="flex items-center gap-6">
                            <NotificationDropdown />
                            <Link to="/settings" className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <UserIcon size={20} /> Settings
                            </Link>
                            <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <LogOut size={16} /> Logout
                            </button>
                        </div>
                    ) : (
                        <div className="flex gap-4">
                            <Link to="/login" className="btn btn-secondary" style={{ padding: '0.6rem 1.5rem' }}>Login</Link>
                            <Link to="/signup" className="btn btn-primary" style={{ padding: '0.6rem 1.5rem' }}>Get Started</Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
