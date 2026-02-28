import React, { useState } from 'react';
import { propertyService, firebaseAuth } from '../services/firebase';
import { getAuth } from 'firebase/auth';

const PropertyUpload = () => {
    const [formData, setFormData] = useState({
        title: '',
        location: '',
        price: '',
        type: 'apartment', // Default type
        description: '',
    });

    const [images, setImages] = useState([]);
    const [video, setVideo] = useState(null);

    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' }); // type: 'success' | 'error'

    const auth = getAuth();

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        if (e.target.files) {
            setImages(Array.from(e.target.files));
        }
    };

    const handleVideoChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setVideo(e.target.files[0]);
        }
    };

    const validateForm = () => {
        if (!formData.title || !formData.location || !formData.price || !formData.description) {
            setStatus({ type: 'error', message: 'Please fill out all text fields.' });
            return false;
        }
        if (images.length === 0) {
            setStatus({ type: 'error', message: 'Please upload at least one image.' });
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ type: '', message: '' });

        if (!validateForm()) return;

        const user = auth.currentUser;
        if (!user) {
            setStatus({ type: 'error', message: 'You must be logged in to upload a property.' });
            return;
        }

        let gps = { lat: 0, lng: 0 };
        try {
            const pos = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });
            gps = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        } catch (err) {
            console.warn("Location not provided for property upload");
        }

        setLoading(true);

        try {
            // 0. Get current landlord verification status
            const userProfile = await firebaseAuth.getUserProfile(user.uid);
            const landlordVerified = userProfile?.verificationStatus === 'approved';

            // 1. Upload Images
            const imageUrls = await Promise.all(
                images.map((img) => propertyService.uploadMedia(img, `properties/${user.uid}/images`))
            );

            // 2. Upload Video (if provided)
            let videoUrl = null;
            if (video) {
                videoUrl = await propertyService.uploadMedia(video, `properties/${user.uid}/videos`);
            }

            // 3. Save to Firestore
            const propertyData = {
                ...formData,
                price: Number(formData.price),
                images: imageUrls,
                video: videoUrl,
                landlordId: user.uid,
                landlordVerified: landlordVerified,
                approvalStatus: 'pending',
                gpsLatitude: gps.lat,
                gpsLongitude: gps.lng,
                timestamp: new Date().toISOString(),
                status: 'active', // e.g., active, pending_escrow, rented
            };

            await propertyService.saveProperty(propertyData);

            setStatus({ type: 'success', message: 'Property uploaded successfully!' });

            // Reset form on success
            setFormData({ title: '', location: '', price: '', type: 'apartment', description: '' });
            setImages([]);
            setVideo(null);

            // Reset file input elements if possible through ref, or let them stay since users might navigate away
        } catch (error) {
            setStatus({ type: 'error', message: `Upload failed: ${error.message}` });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h3 className="mb-4">Upload New Property</h3>

            {status.message && (
                <div style={{
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '1.5rem',
                    backgroundColor: status.type === 'error' ? '#FEE2E2' : '#D1FAE5',
                    color: status.type === 'error' ? '#DC2626' : '#059669',
                    fontWeight: '500'
                }}>
                    {status.message}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label className="form-label">Title</label>
                    <input
                        type="text"
                        name="title"
                        className="form-input"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="e.g. Spacious 2-Br Near Campus"
                        disabled={loading}
                    />
                </div>

                <div className="flex gap-4" style={{ flexWrap: 'wrap' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Location</label>
                        <input
                            type="text"
                            name="location"
                            className="form-input"
                            value={formData.location}
                            onChange={handleInputChange}
                            placeholder="e.g. Area 1, 123 Street"
                            disabled={loading}
                        />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label">Price (NGN / Year)</label>
                        <input
                            type="number"
                            name="price"
                            className="form-input"
                            value={formData.price}
                            onChange={handleInputChange}
                            placeholder="e.g. 500000"
                            disabled={loading}
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Property Type</label>
                    <select name="type" className="form-input" value={formData.type} onChange={handleInputChange} disabled={loading}>
                        <option value="apartment">Full Apartment</option>
                        <option value="room">Single Room (Shared)</option>
                        <option value="house">Entire House</option>
                        <option value="hostel">Hostel Space</option>
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label">Description & Rules</label>
                    <textarea
                        name="description"
                        className="form-input"
                        rows="4"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Describe amenities, proximity to school, rules..."
                        disabled={loading}
                    ></textarea>
                </div>

                <div className="flex gap-4 mb-8" style={{ flexWrap: 'wrap' }}>
                    <div style={{ flex: 1 }}>
                        <label className="form-label">Upload Images (Multiple)</label>
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageChange}
                            disabled={loading}
                            style={{ width: '100%' }}
                        />
                        <small style={{ color: 'var(--text-light)' }}>{images.length} file(s) selected.</small>
                    </div>
                    <div style={{ flex: 1 }}>
                        <label className="form-label">Upload Walkthrough Video</label>
                        <input
                            type="file"
                            accept="video/*"
                            onChange={handleVideoChange}
                            disabled={loading}
                            style={{ width: '100%' }}
                        />
                        <small style={{ color: 'var(--text-light)' }}>{video ? '1' : '0'} file(s) selected.</small>
                    </div>
                </div>

                <button type="submit" className="btn btn-primary w-full text-center justify-center" disabled={loading}>
                    {loading ? 'Uploading Media & Saving...' : 'List Property'}
                </button>
            </form>
        </div>
    );
};

export default PropertyUpload;
