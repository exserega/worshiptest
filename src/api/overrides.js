// Overrides API (Firebase v8) - user/global overrides with history

import { getCurrentUser, getCurrentBranchId } from '../modules/auth/authCheck.js';

const db = window.firebase?.firestore?.();
const auth = window.firebase?.auth?.();

function getSongDoc(songId) {
  if (!db) throw new Error('Firestore is not initialized');
  return db.collection('songs').doc(songId);
}

function getUser() {
  // Prefer authCheck module for role/email; fallback to firebase auth user
  return getCurrentUser?.() || auth?.currentUser || null;
}

export async function saveUserOverride(songId, content) {
  const user = getUser();
  if (!user || user.status === 'guest') throw new Error('Unauthorized');
  const userId = user.uid || user.id;
  const branchId = getCurrentBranchId?.() || user.branchId || null;
  const songDoc = getSongDoc(songId);
  const docRef = songDoc.collection('user_overrides').doc(userId);

  const prevSnap = await docRef.get().catch(() => null);
  const prevContent = prevSnap && prevSnap.exists ? prevSnap.data().content : null;

  await docRef.set({
    content: String(content || ''),
    updatedAt: new Date(),
    editorUid: userId,
    editorEmail: user.email || null,
    editorName: user.name || user.displayName || null,
    branchId: branchId || null
  }, { merge: true });

  // history
  await songDoc.collection('override_history').add({
    type: 'user',
    userId,
    editorEmail: user.email || null,
    branchId: branchId || null,
    previous: prevContent,
    current: String(content || ''),
    at: new Date()
  }).catch(() => {});
}

export async function deleteUserOverride(songId, userIdParam) {
  const user = getUser();
  const userId = userIdParam || user?.uid || user?.id;
  if (!userId) throw new Error('No user');
  const songDoc = getSongDoc(songId);
  const docRef = songDoc.collection('user_overrides').doc(userId);
  const prevSnap = await docRef.get().catch(() => null);
  const prevContent = prevSnap && prevSnap.exists ? prevSnap.data().content : null;
  await docRef.delete();
  await songDoc.collection('override_history').add({
    type: 'user_delete',
    userId,
    previous: prevContent,
    current: null,
    at: new Date()
  }).catch(() => {});
}

export async function saveGlobalOverride(songId, content) {
  const user = getUser();
  if (!user) throw new Error('Unauthorized');
  const branchId = getCurrentBranchId?.() || user.branchId || null;
  // Role checks are done at caller side; we still record editor
  const songDoc = getSongDoc(songId);
  const globalDocId = branchId ? `global_${branchId}` : 'global_default';
  const docRef = songDoc.collection('overrides').doc(globalDocId);
  const prevSnap = await docRef.get().catch(() => null);
  const prevContent = prevSnap && prevSnap.exists ? prevSnap.data().content : null;
  await docRef.set({
    content: String(content || ''),
    updatedAt: new Date(),
    editorUid: user.uid || user.id,
    editorEmail: user.email || null,
    editorName: user.name || user.displayName || null,
    branchId: branchId || null
  }, { merge: true });
  await songDoc.collection('override_history').add({
    type: 'global',
    editorUid: user.uid || user.id,
    editorEmail: user.email || null,
    branchId: branchId || null,
    previous: prevContent,
    current: String(content || ''),
    at: new Date()
  }).catch(() => {});
}

export async function deleteGlobalOverride(songId) {
  const user = getUser();
  const branchId = getCurrentBranchId?.() || user?.branchId || null;
  const songDoc = getSongDoc(songId);
  const globalDocId = branchId ? `global_${branchId}` : 'global_default';
  const docRef = songDoc.collection('overrides').doc(globalDocId);
  const prevSnap = await docRef.get().catch(() => null);
  const prevContent = prevSnap && prevSnap.exists ? prevSnap.data().content : null;
  await docRef.delete();
  await songDoc.collection('override_history').add({
    type: 'global_delete',
    editorUid: user?.uid || user?.id || null,
    branchId: branchId || null,
    previous: prevContent,
    current: null,
    at: new Date()
  }).catch(() => {});
}

export function subscribeResolvedContent(songId, onChange, onGlobalUpdateForUser, options = {}) {
  const user = getUser();
  const userId = user?.uid || user?.id || null;
  const viewerBranchId = options.viewerBranchId || getCurrentBranchId?.() || user?.branchId || null;
  const songDoc = getSongDoc(songId);
  let latestUser = null;
  let latestGlobal = null;

  function emit() {
    const userExists = latestUser && latestUser.exists && (
      !viewerBranchId || latestUser.data()?.branchId === viewerBranchId
    );
    const globalExists = latestGlobal && latestGlobal.exists;
    const userData = userExists ? latestUser.data() : null;
    const globalData = globalExists ? latestGlobal.data() : null;
    const resolved = userExists ? userData.content
                   : globalExists ? globalData.content
                   : null; // caller should fallback to base
    const source = userExists ? 'user' : (globalExists ? 'global' : 'base');
    onChange && onChange({ content: resolved, source, user: userData, global: globalData });
    if (globalExists) {
      onGlobalUpdateForUser && onGlobalUpdateForUser({ global: globalData, user: userData });
    }
  }

  const unsubs = [];
  if (userId) {
    unsubs.push(songDoc.collection('user_overrides').doc(userId).onSnapshot(s => { latestUser = s; emit(); }));
  }
  // Subscribe to branch-scoped global override
  const globalDocId = viewerBranchId ? `global_${viewerBranchId}` : 'global_default';
  unsubs.push(songDoc.collection('overrides').doc(globalDocId).onSnapshot(s => { latestGlobal = s; emit(); }));
  return () => unsubs.forEach(u => { try { u(); } catch(e) {} });
}

