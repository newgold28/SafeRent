import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCRd3E-c7vOQ3G31oU7MpXDFz0Un-wrA98",
    authDomain: "saferent-c626c.firebaseapp.com",
    projectId: "saferent-c626c",
    storageBucket: "saferent-c626c.firebasestorage.app",
    messagingSenderId: "745318946956",
    appId: "1:745318946956:web:c468368ca8ecf9e52ec3a9",
    measurementId: "G-3MZYY3CE2K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export const firebaseAuth = {
    signIn: async (email, password) => {
        try {
            // 1. Authenticate user
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Fetch user role from Firestore
            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);

            let role = 'student'; // fallback
            if (userDocSnap.exists()) {
                role = userDocSnap.data().role;
            }

            return { user: { ...user, role } };
        } catch (error) {
            throw error;
        }
    },

    signUp: async (email, password, role) => {
        try {
            // 1. Create authentication user
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Save role to Firestore
            const userDocRef = doc(db, 'users', user.uid);
            await setDoc(userDocRef, {
                email: user.email,
                role: role,
                verificationStatus: role === 'landlord' ? 'pending' : 'approved', // Landlords need review
                createdAt: new Date().toISOString()
            });

            return { user: { ...user, role } };
        } catch (error) {
            throw error;
        }
    },

    signOut: async () => {
        return await signOut(auth);
    },

    getUserProfile: async (userId) => {
        try {
            const userRef = doc(db, 'users', userId);
            const userSnap = await getDoc(userRef);
            return userSnap.exists() ? userSnap.data() : null;
        } catch (error) {
            console.error("Error fetching user profile", error);
            return null;
        }
    }
};

export const propertyService = {
    uploadMedia: async (file, path) => {
        return new Promise((resolve, reject) => {
            const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    // Optional: handle progress
                },
                (error) => {
                    console.error("Upload failed", error);
                    reject(error);
                },
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve(downloadURL);
                }
            );
        });
    },

    saveProperty: async (propertyData) => {
        try {
            const propertiesRef = collection(db, 'properties');
            const newDoc = await addDoc(propertiesRef, {
                ...propertyData,
                approvalStatus: 'pending', // All new properties need approval
                createdAt: new Date().toISOString()
            });
            return newDoc.id;
        } catch (error) {
            console.error("Error saving property", error);
            throw error;
        }
    }
};

export const bookingService = {
    // Student initiates a booking
    requestBooking: async (propertyId, landlordId, studentId, amount, paymentReference) => {
        try {
            const bookingsRef = collection(db, 'bookings');
            const newBooking = await addDoc(bookingsRef, {
                propertyId,
                landlordId,
                studentId,
                amount,
                paymentReference,
                status: 'pending', // pending, confirmed, rejected
                createdAt: new Date().toISOString()
            });
            return newBooking.id;
        } catch (error) {
            console.error("Error requesting booking", error);
            throw error;
        }
    },

    // Landlord acts on a booking
    updateBookingStatus: async (bookingId, newStatus) => {
        try {
            const bookingRef = doc(db, 'bookings', bookingId);
            const bookingSnap = await getDoc(bookingRef);

            if (!bookingSnap.exists()) throw new Error("Booking not found");
            const bookingData = bookingSnap.data();

            await setDoc(bookingRef, { status: newStatus }, { merge: true });

            // If confirmed, update wallet (add to pending escrow)
            if (newStatus === 'confirmed') {
                const walletRef = doc(db, 'wallets', bookingData.landlordId);
                const walletSnap = await getDoc(walletRef);
                const currentPending = walletSnap.exists() ? walletSnap.data().pendingEscrow || 0 : 0;

                await setDoc(walletRef, {
                    pendingEscrow: currentPending + Number(bookingData.amount)
                }, { merge: true });
            }
        } catch (error) {
            console.error("Error updating booking status", error);
            throw error;
        }
    }
};

export const roommateService = {
    // Student posts a roommate request
    postRequest: async (studentId, studentName, postData) => {
        try {
            const requestsRef = collection(db, 'roommateRequests');
            const newRequest = await addDoc(requestsRef, {
                studentId,
                studentName,
                ...postData,
                status: 'active', // active, resolved
                createdAt: new Date().toISOString()
            });
            return newRequest.id;
        } catch (error) {
            console.error("Error posting roommate request", error);
            throw error;
        }
    }
};

export const chatService = {
    // Send a message
    sendMessage: async (senderId, receiverId, conversationId, text) => {
        try {
            const messagesRef = collection(db, `conversations/${conversationId}/messages`);
            await addDoc(messagesRef, {
                senderId,
                receiverId,
                text,
                timestamp: new Date().toISOString()
            });

            // Update conversation metadata
            const convRef = doc(db, 'conversations', conversationId);
            await setDoc(convRef, {
                lastMessage: text,
                lastMessageTime: new Date().toISOString(),
                participants: [senderId, receiverId]
            }, { merge: true });
        } catch (error) {
            console.error("Error sending message", error);
            throw error;
        }
    },

    // New: Initiate or get a conversation ID between two users
    initiateConversation: async (user1, user2) => {
        try {
            const conversationsRef = collection(db, 'conversations');
            const conversationId = [user1, user2].sort().join('_');
            const convRef = doc(db, 'conversations', conversationId);
            const convSnap = await getDoc(convRef);

            if (!convSnap.exists()) {
                await setDoc(convRef, {
                    participants: [user1, user2],
                    createdAt: new Date().toISOString(),
                    lastMessage: 'Conversation started',
                    lastMessageTime: new Date().toISOString()
                });
            }
            return conversationId;
        } catch (error) {
            console.error("Error initiating conversation", error);
            throw error;
        }
    },

    // Admin review helpers
    getPendingLandlords: async () => {
        return collection(db, 'users');
    },

    updateLandlordStatus: async (userId, status) => {
        try {
            const userRef = doc(db, 'users', userId);
            await setDoc(userRef, { verificationStatus: status }, { merge: true });
        } catch (error) {
            console.error("Error updating landlord status", error);
            throw error;
        }
    }
};

export const walletService = {
    // Get/Listen to wallet data
    getWallet: (landlordId, callback) => {
        const walletRef = doc(db, 'wallets', landlordId);
        return onSnapshot(walletRef, (snapshot) => {
            if (snapshot.exists()) {
                callback(snapshot.data());
            } else {
                // Initialize wallet if it doesn't exist
                setDoc(walletRef, {
                    availableBalance: 0,
                    pendingEscrow: 0,
                    totalEarned: 0,
                    withdrawals: []
                });
                callback({ availableBalance: 0, pendingEscrow: 0, totalEarned: 0, withdrawals: [] });
            }
        });
    },

    // Request a withdrawal
    requestWithdrawal: async (landlordId, amount, bankDetails) => {
        try {
            const walletRef = doc(db, 'wallets', landlordId);
            const walletSnap = await getDoc(walletRef);

            if (!walletSnap.exists() || walletSnap.data().availableBalance < amount) {
                throw new Error("Insufficient balance");
            }

            const withdrawal = {
                id: `WD-${Date.now()}`,
                amount,
                bankDetails,
                status: 'pending',
                timestamp: new Date().toISOString()
            };

            await setDoc(walletRef, {
                availableBalance: walletSnap.data().availableBalance - amount,
                withdrawals: [withdrawal, ...(walletSnap.data().withdrawals || [])]
            }, { merge: true });

            return withdrawal.id;
        } catch (error) {
            console.error("Withdrawal request failed", error);
            throw error;
        }
    },

    // Internal: Release escrow funds to available balance
    releaseEscrow: async (landlordId, amount) => {
        try {
            const walletRef = doc(db, 'wallets', landlordId);
            const walletSnap = await getDoc(walletRef);
            const data = walletSnap.data() || { availableBalance: 0, pendingEscrow: 0, totalEarned: 0 };

            await setDoc(walletRef, {
                availableBalance: data.availableBalance + amount,
                pendingEscrow: Math.max(0, data.pendingEscrow - amount),
                totalEarned: data.totalEarned + amount
            }, { merge: true });
        } catch (error) {
            console.error("Escrow release failed", error);
        }
    }
};

export const verificationService = {
    submitVerification: async (userId, data) => {
        try {
            const userRef = doc(db, 'users', userId);
            await setDoc(userRef, {
                ...data,
                verificationStatus: 'pending',
                updatedAt: new Date().toISOString()
            }, { merge: true });
        } catch (error) {
            console.error("Error submitting verification", error);
            throw error;
        }
    },

    approveProperty: async (propertyId, status) => {
        try {
            const propertyRef = doc(db, 'properties', propertyId);
            await setDoc(propertyRef, { approvalStatus: status }, { merge: true });
        } catch (error) {
            console.error("Error approving property", error);
            throw error;
        }
    }
};
