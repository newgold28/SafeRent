import React, { useState, useRef, useEffect } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Video, MapPin, Clock, ShieldCheck, RefreshCw, StopCircle, Play } from 'lucide-react';

const VideoVerification = ({ userId, onComplete }) => {
    const [recording, setRecording] = useState(false);
    const [videoBlob, setVideoBlob] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [location, setLocation] = useState(null);
    const [timestamp, setTimestamp] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [error, setError] = useState(null);

    const videoRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const chunksRef = useRef([]);

    const startRecording = async () => {
        try {
            setError(null);
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            videoRef.current.srcObject = stream;

            // Get location at start of recording
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setLocation({
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude
                    });
                },
                (err) => {
                    console.error("Location error:", err);
                    setError("Location access is required for verification.");
                }
            );

            setTimestamp(new Date().toISOString());

            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'video/webm' });
                setVideoBlob(blob);
                setPreviewUrl(URL.createObjectURL(blob));

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setRecording(true);
        } catch (err) {
            console.error("Media error:", err);
            setError("Could not access camera/microphone.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && recording) {
            mediaRecorderRef.current.stop();
            setRecording(false);
        }
    };

    const handleUpload = async () => {
        if (!videoBlob || !location) return;

        setUploading(true);
        try {
            const storage = getStorage();
            const storageRef = ref(storage, `verification_videos/${userId}_${Date.now()}.webm`);
            await uploadBytes(storageRef, videoBlob);
            const downloadURL = await getDownloadURL(storageRef);

            onComplete({
                videoUrl: downloadURL,
                gpsLatitude: location.lat,
                gpsLongitude: location.lng,
                timestamp: timestamp
            });
        } catch (err) {
            console.error("Upload error:", err);
            setError("Failed to upload video.");
        } finally {
            setUploading(false);
        }
    };

    const reset = () => {
        setVideoBlob(null);
        setPreviewUrl(null);
        setLocation(null);
        setTimestamp(null);
        setError(null);
    };

    return (
        <div className="card" style={{ maxWidth: '600px', margin: '2rem auto' }}>
            <div className="flex items-center gap-3 mb-6">
                <div style={{ backgroundColor: 'var(--primary-color)', color: 'white', padding: '10px', borderRadius: '12px' }}>
                    <ShieldCheck size={24} />
                </div>
                <div>
                    <h3 style={{ margin: 0 }}>Identity Video Verification</h3>
                    <p className="text-sm text-light">Confirm your identity with a quick video clip.</p>
                </div>
            </div>

            <div
                style={{
                    width: '100%',
                    aspectRatio: '16/9',
                    backgroundColor: '#000',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    position: 'relative',
                    marginBottom: '1.5rem',
                    boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5)'
                }}
                onContextMenu={(e) => e.preventDefault()} // Prevent download
            >
                {previewUrl ? (
                    <video
                        src={previewUrl}
                        controls={false} // Prevent standard controls
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        autoPlay
                        loop
                    />
                ) : (
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                )}

                {recording && (
                    <div style={{ position: 'absolute', top: '15px', left: '15px', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(255, 0, 0, 0.7)', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold' }}>
                        <div style={{ width: '8px', height: '8px', backgroundColor: 'white', borderRadius: '50%', animation: 'pulse 1s infinite' }} />
                        REC
                    </div>
                )}
            </div>

            {error && (
                <div className="alert alert-error mb-4">
                    {error}
                </div>
            )}

            <div className="flex flex-col gap-4">
                {location && (
                    <div className="flex items-center gap-4 text-sm bg-light p-3 rounded-lg" style={{ backgroundColor: '#f9fafb' }}>
                        <div className="flex items-center gap-1 text-primary"><MapPin size={16} /> {location.lat.toFixed(4)}, {location.lng.toFixed(4)}</div>
                        <div className="flex items-center gap-1"><Clock size={16} /> {new Date(timestamp).toLocaleTimeString()}</div>
                    </div>
                )}

                <div className="flex gap-4">
                    {!videoBlob ? (
                        <button
                            className={`btn w-full flex items-center justify-center gap-2 ${recording ? 'btn-danger' : 'btn-primary'}`}
                            onClick={recording ? stopRecording : startRecording}
                        >
                            {recording ? (
                                <><StopCircle size={20} /> Stop Recording</>
                            ) : (
                                <><Video size={20} /> Start Recording</>
                            )}
                        </button>
                    ) : (
                        <>
                            <button className="btn btn-secondary flex-1 flex items-center justify-center gap-2" onClick={reset}>
                                <RefreshCw size={18} /> Re-take
                            </button>
                            <button
                                className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                                onClick={handleUpload}
                                disabled={uploading || !location}
                            >
                                {uploading ? <RefreshCw size={18} className="animate-spin" /> : <><ShieldCheck size={18} /> Submit Clip</>}
                            </button>
                        </>
                    )}
                </div>
            </div>

            <style>
                {`
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.2); opacity: 0.5; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .btn-danger {
                    background-color: var(--danger-color);
                    color: white;
                }
                `}
            </style>
        </div>
    );
};

export default VideoVerification;
