import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { User, Phone, AlignLeft, ShieldCheck, Mail } from 'lucide-react';

const Settings = () => {
    const [profile, setProfile] = useState({
        displayName: '',
        phoneNumber: '',
        bio: '',
        role: '',
        email: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const auth = getAuth();
    const db = getFirestore();

    useEffect(() => {
        const fetchProfile = async () => {
            const user = auth.currentUser;
            if (user) {
                try {
                    const docRef = doc(db, 'users', user.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        setProfile({
                            displayName: docSnap.data().displayName || '',
                            phoneNumber: docSnap.data().phoneNumber || '',
                            bio: docSnap.data().bio || '',
                            role: docSnap.data().role || 'student', // default fallback
                            email: user.email || ''
                        });
                    }
                } catch (error) {
                    console.error("Error fetching profile:", error);
                    setErrorMessage("Failed to load profile data.");
                }
            }
            setLoading(false);
        };

        fetchProfile();
    }, [auth]);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSuccessMessage('');
        setErrorMessage('');

        const user = auth.currentUser;
        if (!user) return;

        try {
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                displayName: profile.displayName,
                phoneNumber: profile.phoneNumber,
                bio: profile.bio
            });

            setSuccessMessage("Profile updated successfully!");
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            console.error("Error updating profile:", error);
            setErrorMessage("Failed to update profile. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="container" style={{ padding: '4rem 1rem', textAlign: 'center' }}>
                Loading profile...
            </div>
        );
    }

    return (
        <div className="container" style={{ padding: '4rem 1rem', maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <User size={36} color="var(--primary-color)" /> Profile Settings
            </h1>

            <div className="card" style={{ padding: '2rem' }}>
                {successMessage && (
                    <div style={{ padding: '1rem', backgroundColor: '#D1FAE5', color: '#065F46', borderRadius: '8px', marginBottom: '1.5rem', fontWeight: 'bold' }}>
                        {successMessage}
                    </div>
                )}
                {errorMessage && (
                    <div style={{ padding: '1rem', backgroundColor: '#FEE2E2', color: '#991B1B', borderRadius: '8px', marginBottom: '1.5rem', fontWeight: 'bold' }}>
                        {errorMessage}
                    </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', padding: '1.5rem', backgroundColor: 'var(--background-color)', borderRadius: '12px' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>
                        {profile.displayName?.charAt(0)?.toUpperCase() || <User size={30} />}
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', margin: 0 }}>{profile.displayName || 'Set your name'}</h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem', color: 'var(--text-light)', fontSize: '0.9rem' }}>
                            <ShieldCheck size={16} color="var(--primary-color)" />
                            {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)} Account
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Email Address</label>
                        <div className="input-group" style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--background-color)', padding: '0.75rem 1rem', borderRadius: '8px', color: 'var(--text-light)' }}>
                            <Mail size={20} style={{ marginRight: '0.5rem', color: 'var(--text-light)' }} />
                            <span>{profile.email}</span>
                        </div>
                        <small style={{ color: 'var(--text-light)', marginTop: '0.25rem', display: 'block' }}>Email cannot be changed.</small>
                    </div>

                    <div className="form-group">
                        <label>Display Name</label>
                        <div className="input-wrapper" style={{ position: 'relative' }}>
                            <User size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                            <input
                                type="text"
                                className="form-control"
                                value={profile.displayName}
                                onChange={(e) => setProfile({ ...profile, displayName: e.target.value })}
                                style={{ paddingLeft: '3rem' }}
                                placeholder="Enter your full name"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Phone Number</label>
                        <div className="input-wrapper" style={{ position: 'relative' }}>
                            <Phone size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                            <input
                                type="tel"
                                className="form-control"
                                value={profile.phoneNumber}
                                onChange={(e) => setProfile({ ...profile, phoneNumber: e.target.value })}
                                style={{ paddingLeft: '3rem' }}
                                placeholder="e.g. +234 800 000 0000"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Bio / About Me</label>
                        <div className="input-wrapper" style={{ position: 'relative' }}>
                            <AlignLeft size={20} style={{ position: 'absolute', left: '1rem', top: '1.25rem', color: 'var(--text-light)' }} />
                            <textarea
                                className="form-control"
                                value={profile.bio}
                                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                style={{ paddingLeft: '3rem', minHeight: '120px', resize: 'vertical' }}
                                placeholder={profile.role === 'landlord' ? "Tell students a bit about the properties you manage..." : "Tell landlords and potential roommates about yourself..."}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={saving}
                        style={{ marginTop: '1rem', padding: '1rem', fontSize: '1.1rem' }}
                    >
                        {saving ? 'Saving Changes...' : 'Save Changes'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Settings;
