/**
 * @fileoverview Notifications API (Firebase v8)
 * Provides subscription to unread count, listing, and marking notifications as read
 */

import { db, auth, firebase } from '/js/firebase-config.js';

/**
 * Subscribe to unread notifications count for current user
 * @param {(count:number)=>void} onChange
 * @returns {() => void} unsubscribe
 */
export function subscribeUnreadCount(onChange) {
  const user = auth?.currentUser;
  if (!user) return () => {};
  const ref = db.collection('users').doc(user.uid).collection('notifications').where('read', '==', false);
  const unsub = ref.onSnapshot((snap) => {
    try {
      const count = snap.size || 0;
      onChange?.(count);
    } catch (e) {
      onChange?.(0);
    }
  }, () => onChange?.(0));
  return unsub;
}

/**
 * Fetch recent notifications for current user
 * @param {number} limitCount
 * @returns {Promise<Array<object>>}
 */
export async function fetchNotifications(limitCount = 50) {
  const user = auth?.currentUser;
  if (!user) return [];
  const ref = db.collection('users').doc(user.uid).collection('notifications')
    .orderBy('createdAt', 'desc')
    .limit(limitCount);
  const snap = await ref.get();
  const list = [];
  snap.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
  return list;
}

/**
 * Mark one notification as read
 * @param {string} notificationId
 * @returns {Promise<void>}
 */
export async function markNotificationRead(notificationId) {
  const user = auth?.currentUser;
  if (!user || !notificationId) return;
  const ref = db.collection('users').doc(user.uid).collection('notifications').doc(notificationId);
  await ref.set({ read: true, readAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
}

/**
 * Mark all unread notifications as read
 * @returns {Promise<void>}
 */
export async function markAllNotificationsRead() {
  const user = auth?.currentUser;
  if (!user) return;
  const ref = db.collection('users').doc(user.uid).collection('notifications').where('read', '==', false);
  const snap = await ref.get();
  const batch = db.batch();
  snap.forEach((doc) => {
    batch.set(doc.ref, { read: true, readAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
  });
  await batch.commit();
}

/**
 * Create notification for a user (client-side helper)
 * @param {string} userId
 * @param {object} payload
 * @returns {Promise<string|null>} new id
 */
export async function createNotificationForUser(userId, payload) {
  if (!userId || !payload) return null;
  const ref = db.collection('users').doc(userId).collection('notifications');
  const data = {
    type: payload.type || 'event_participant_added',
    eventId: payload.eventId || '',
    eventName: payload.eventName || '',
    eventDate: payload.eventDate || null,
    placements: Array.isArray(payload.placements) ? payload.placements : [],
    branchId: payload.branchId || null,
    read: false,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  };
  const docRef = await ref.add(data);
  return docRef?.id || null;
}

