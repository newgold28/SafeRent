import React, { useState, useEffect } from 'react';
import { getFirestore, collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { roommateService } from '../services/firebase';
import { User, MapPin, Calendar, DollarSign, Search } from 'lucide-react';

const RoommateFinderWidget = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        budget: '',
        location: 'Ibadan',
        moveInDate: '',
        gender: 'any',
        bio: ''
    });

    // Filter State
    const [filters, setFilters] = useState({
        budget: '',
        location: 'Ibadan',
        gender: 'all'
    });

    const auth = getAuth();
    const db = getFirestore();

    // Fetch real-time feed
    useEffect(() => {
        const q = query(collection(db, 'roommateRequests'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const postsData = [];
            snapshot.forEach((doc) => {
                postsData.push({ id: doc.id, ...doc.data() });
            });
            setPosts(postsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching roommate posts:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleSubmitPost = async (e) => {
        e.preventDefault();
        if (!auth.currentUser) {
            alert("Please login to post a roommate request.");
            return;
        }

        try {
            await roommateService.postRequest(
                auth.currentUser.uid,
                auth.currentUser.email.split('@')[0], // Mock display name from email
                formData
            );
            alert("Roommate request posted successfully!");
            setShowForm(false);
            setFormData({ budget: '', location: '', moveInDate: '', gender: 'any', bio: '' });
        } catch (error) {
            alert("Failed to post request.");
        }
    };

    // Apply Client-Side Filters
    const filteredPosts = posts.filter(post => {
        if (post.status !== 'active') return false;

        const matchLocation = post.location.toLowerCase().includes(filters.location.toLowerCase());
        const matchGender = filters.gender === 'all' || post.gender === filters.gender || post.gender === 'any';

        const filterBudget = filters.budget ? Number(filters.budget) : Infinity;
        const postBudget = Number(post.budget);
        const matchBudget = postBudget <= filterBudget;

        return matchLocation && matchGender && matchBudget;
    });

    return (
        <div className="mt-12">
            <div className="flex justify-between items-center mb-8">
                <h2>Roommate Finder</h2>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowForm(!showForm)}
                    style={{ backgroundColor: showForm ? 'var(--text-color)' : 'var(--primary-color)' }}
                >
                    {showForm ? 'Cancel Post' : 'Post Request'}
                </button>
            </div>

            {/* Posting Form */}
            {showForm && (
                <div className="card mb-8" style={{ border: '2px solid var(--primary-color)' }}>
                    <h3 className="mb-4">Create Roommate Request</h3>
                    <form onSubmit={handleSubmitPost}>
                        <div className="form-group flex gap-4 flex-wrap">
                            <div style={{ flex: '1 1 200px' }}>
                                <label className="form-label">Max Budget (₦)</label>
                                <input required type="number" name="budget" className="form-input" value={formData.budget} onChange={handleFormChange} placeholder="e.g. 500000" />
                            </div>
                            <div style={{ flex: '1 1 200px' }}>
                                <label className="form-label">Preferred Location</label>
                                <input required type="text" name="location" className="form-input" value={formData.location} onChange={handleFormChange} placeholder="e.g. UI, Ibadan" />
                            </div>
                        </div>
                        <div className="form-group flex gap-4 flex-wrap">
                            <div style={{ flex: '1 1 200px' }}>
                                <label className="form-label">Target Move-in Date</label>
                                <input required type="date" name="moveInDate" className="form-input" value={formData.moveInDate} onChange={handleFormChange} />
                            </div>
                            <div style={{ flex: '1 1 200px' }}>
                                <label className="form-label">Preferred Gender</label>
                                <select required name="gender" className="form-input" value={formData.gender} onChange={handleFormChange}>
                                    <option value="any">Any Gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Short Bio & Preferences</label>
                            <textarea required name="bio" className="form-input" rows="3" value={formData.bio} onChange={handleFormChange} placeholder="Hi, I'm a quiet student looking for a neat roommate..."></textarea>
                        </div>
                        <button type="submit" className="btn btn-primary w-full">Publish Request</button>
                    </form>
                </div>
            )}

            {/* Filters Bar */}
            <div className="card mb-8" style={{ backgroundColor: '#f9fafb' }}>
                <div className="flex gap-4 items-end flex-wrap">
                    <div className="form-group mb-0" style={{ flex: '1 1 200px' }}>
                        <label className="form-label text-sm"><Search size={14} className="inline mr-1" />Search Location</label>
                        <input type="text" name="location" className="form-input" placeholder="e.g. Ibadan" value={filters.location} onChange={handleFilterChange} />
                    </div>
                    <div className="form-group mb-0" style={{ flex: '1 1 150px' }}>
                        <label className="form-label text-sm">Max Budget (₦)</label>
                        <input type="number" name="budget" className="form-input" placeholder="Any" value={filters.budget} onChange={handleFilterChange} />
                    </div>
                    <div className="form-group mb-0" style={{ flex: '1 1 150px' }}>
                        <label className="form-label text-sm">Gender</label>
                        <select name="gender" className="form-input" value={filters.gender} onChange={handleFilterChange}>
                            <option value="all">All</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Live Feed */}
            {loading ? (
                <div className="text-center py-8">Loading posts...</div>
            ) : filteredPosts.length === 0 ? (
                <div className="text-center py-8 text-light card">No active roommate requests match your filters.</div>
            ) : (
                <div className="flex flex-col gap-4">
                    {filteredPosts.map(post => (
                        <div key={post.id} className="card flex justify-between gap-4 flex-wrap items-start">
                            <div style={{ flex: '2 1 400px' }}>
                                <div className="flex items-center gap-3 mb-2">
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                        {post.studentName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h4 style={{ margin: 0 }}>{post.studentName}</h4>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                                            Posted {new Date(post.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                <p style={{ marginTop: '0.5rem', marginBottom: '1rem', lineHeight: 1.5 }}>"{post.bio}"</p>

                                <div className="flex gap-4 flex-wrap text-sm text-light">
                                    <div className="flex items-center gap-1"><MapPin size={14} /> Wants: {post.location}</div>
                                    <div className="flex items-center gap-1"><Calendar size={14} /> Move-in: {post.moveInDate}</div>
                                    <div className="flex items-center gap-1"><User size={14} /> Prefers: <span style={{ textTransform: 'capitalize' }}>{post.gender}</span></div>
                                </div>
                            </div>

                            <div className="flex flex-col items-end gap-3" style={{ flex: '1 1 150px', minWidth: '150px' }}>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--text-color)' }}>
                                    ₦{Number(post.budget).toLocaleString()}<span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>/yr</span>
                                </div>
                                <button className="btn btn-secondary w-full">Message</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RoommateFinderWidget;
