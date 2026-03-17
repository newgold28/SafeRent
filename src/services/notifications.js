import { collection, addDoc, query, where, orderBy, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Creates a new notification for a user
 * @param {string} userId - The ID of the user receiving the notification
 * @param {string} title - Notification title
 * @param {string} message - Notification message body
 * @param {string} type - Notification type (e.g., 'booking_approved', 'new_message', 'system')
 * @param {string} relatedId - ID of the related document (e.g., bookingId, chatId)
 */
export const createNotification = async (userId, title, message, type = 'system', relatedId = null) => {
    try {
        await addDoc(collection(db, 'notifications'), {
            userId,
            title,
            message,
            type,
            relatedId,
            isRead: false,
            createdAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Error creating notification: ", error);
    }
};

/**
 * Subscribes to a user's notifications
 * @param {string} userId - The user ID to listen for
 * @param {function} callback - Function to call with the notifications data
 * @returns {function} Unsubscribe function
 */
export const subscribeToNotifications = (userId, callback) => {
    if (!userId) return () => { };

    const q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId)
    );

    return onSnapshot(q, (snapshot) => {
        const notifications = [];
        snapshot.forEach((doc) => {
            notifications.push({ id: doc.id, ...doc.data() });
        });

        // Sort locally to bypass Firebase composite index requirements
        notifications.sort((a, b) => {
            const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
            const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
            return timeB - timeA;
        });

        callback(notifications);
    }, (error) => {
        console.error("Error listening to notifications:", error);
    });
};

/**
 * Marks a specific notification as read
 * @param {string} notificationId - The ID of the notification to update
 */
export const markNotificationAsRead = async (notificationId) => {
    try {
        const notifRef = doc(db, 'notifications', notificationId);
        await updateDoc(notifRef, {
            isRead: true
        });
    } catch (error) {
        console.error("Error marking notification as read:", error);
    }
};

/**
 * Marks all notifications for a user as read
 * @param {string} userId - The user ID
 */
export const markAllNotificationsAsRead = async (userId, notifications) => {
    try {
        const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);

        // Firestore batch or individual updates
        // To keep it simple, we do individual updates here since it's client side
        const updatePromises = unreadIds.map(id => {
            const ref = doc(db, 'notifications', id);
            return updateDoc(ref, { isRead: true });
        });

        await Promise.all(updatePromises);
    } catch (error) {
        console.error("Error marking all notifications as read:", error);
    }
};
