import React, { useState } from 'react';
import { getAuth } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { verificationService } from '../services/firebase';
import VideoVerification from './VideoVerification';
import { FileText, Image, Clipboard, CheckCircle, AlertCircle, Loader } from 'lucide-react';

const LandlordVerification = ({ onComplete }) => {
    const [step, setStep] = useState(1); // 1: Info, 2: Documents, 3: Video, 4: Success
    const [nin, setNin] = useState('');
    const [files, setFiles] = useState({
        ninImage: null,
        licenseImage: null,
        ownershipDoc: null
    });
    const [videoData, setVideoData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const auth = getAuth();

    const handleFileChange = (e) => {
        setFiles({ ...files, [e.target.name]: e.target.files[0] });
    };

    const uploadFiles = async () => {
        const storage = getStorage();
        const uploadPromises = Object.keys(files).map(async (key) => {
            const file = files[key];
            if (!file) return null;
            const fileRef = ref(storage, `verifications/${auth.currentUser.uid}/${key}_${Date.now()}`);
            await uploadBytes(fileRef, file);
            return { [key]: await getDownloadURL(fileRef) };
        });

        const urls = await Promise.all(uploadPromises);
        return Object.assign({}, ...urls);
    };

    const handleSubmit = async (finalVideoData) => {
        setLoading(true);
        setError(null);
        try {
            const fileUrls = await uploadFiles();

            await verificationService.submitVerification(auth.currentUser.uid, {
                nin,
                ...fileUrls,
                ...finalVideoData
            });

            setStep(4);
            if (onComplete) onComplete();
        } catch (err) {
            console.error("Submission error:", err);
            setError("Failed to submit verification request. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (step === 4) {
        return (
            <div className="card text-center py-12">
                <div style={{ color: 'var(--success-color)', marginBottom: '1.5rem' }}>
                    <CheckCircle size={64} style={{ margin: '0 auto' }} />
                </div>
                <h2>Verification Submitted!</h2>
                <p className="text-light" style={{ maxWidth: '400px', margin: '0 auto' }}>
                    Our team is reviewing your documents. This typically takes 24-48 hours. You will be notified once your account is verified.
                </p>
                <button className="btn btn-primary mt-8" onClick={() => window.location.reload()}>
                    Back to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="card" style={{ maxWidth: '700px', margin: '2rem auto' }}>
            {/* Progress Stepper */}
            <div className="flex justify-between mb-8" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                {['General Info', 'Document Upload', 'Identity Video'].map((label, i) => (
                    <div key={i} className="flex items-center gap-2" style={{ opacity: step === i + 1 ? 1 : 0.4, color: step === i + 1 ? 'var(--primary-color)' : 'inherit', fontWeight: step === i + 1 ? 'bold' : 'normal' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '2px solid', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</div>
                        <span className="text-sm">{label}</span>
                    </div>
                ))}
            </div>

            {error && <div className="alert alert-error mb-6"><AlertCircle size={18} /> {error}</div>}

            {step === 1 && (
                <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-3">
                        <FileText className="text-primary" />
                        <h3 style={{ margin: 0 }}>National Identity Number</h3>
                    </div>
                    <div className="form-group">
                        <label className="form-label">11-Digit NIN Number</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="Enter your NIN"
                            maxLength={11}
                            value={nin}
                            onChange={(e) => setNin(e.target.value)}
                        />
                    </div>
                    <button
                        className="btn btn-primary"
                        disabled={nin.length < 11}
                        onClick={() => setStep(2)}
                    >
                        Next: Upload Documents
                    </button>
                </div>
            )}

            {step === 2 && (
                <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-3">
                        <Image className="text-primary" />
                        <h3 style={{ margin: 0 }}>Required Documents</h3>
                    </div>

                    <div className="grid gap-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                        <div className="form-group">
                            <label className="form-label">NIN Slip/Card Image</label>
                            <input type="file" name="ninImage" className="form-input" accept="image/*" onChange={handleFileChange} />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Driver's License / Int'l Passport</label>
                            <input type="file" name="licenseImage" className="form-input" accept="image/*" onChange={handleFileChange} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Property Ownership Document (C of O, Receipt, etc.)</label>
                        <input type="file" name="ownershipDoc" className="form-input" accept=".pdf,image/*" onChange={handleFileChange} />
                    </div>

                    <div className="flex gap-4">
                        <button className="btn btn-secondary flex-1" onClick={() => setStep(1)}>Back</button>
                        <button
                            className="btn btn-primary flex-1"
                            disabled={!files.ninImage || !files.licenseImage || !files.ownershipDoc}
                            onClick={() => setStep(3)}
                        >
                            Next: Video Verification
                        </button>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="animate-fade-in">
                    {loading ? (
                        <div className="text-center py-12">
                            <Loader className="animate-spin mb-4" size={48} />
                            <h3>Uploading verification data...</h3>
                            <p className="text-light">Please do not close the window.</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex items-center gap-3 mb-4">
                                <Clipboard className="text-primary" />
                                <h3 style={{ margin: 0 }}>Step 3: Identity Verification</h3>
                            </div>
                            <p className="text-sm text-light mb-6">
                                Provide a short 5-10 second video clip of yourself while holding your NIN card.
                                Ensure your face is clearly visible.
                            </p>
                            <VideoVerification userId={auth.currentUser?.uid} onComplete={handleSubmit} />
                            <button className="btn btn-secondary w-full mt-4" onClick={() => setStep(2)}>Back to Documents</button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default LandlordVerification;
