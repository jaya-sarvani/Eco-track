import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase";

// ============================================================================
// USER OPERATIONS
// ============================================================================

/**
 * Create a new user profile document.
 */
export async function createUserProfile(uid, data) {
  const userRef = doc(db, "users", uid);
  const profile = {
    uid,
    name: data.name || "",
    email: data.email || "",
    carbonBudget: data.carbonBudget ?? 15.0,
    streak: 0,
    badges: [],
    createdAt: new Date().toISOString(),
  };
  await setDoc(userRef, profile);
  return profile;
}

/**
 * Get user profile by uid.
 */
export async function getUserProfile(uid) {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * Update user profile fields.
 */
export async function updateUserProfile(uid, updates) {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, updates);
  return updates;
}

// ============================================================================
// ACTIVITY / LOG OPERATIONS
// ============================================================================

/**
 * Save a log entry (travel, food, or energy) for a user on a given date.
 * Merges with existing log for that date if present.
 */
export async function saveActivityLog(userId, date, logType, detailsData, emissions) {
  const docId = `${userId}_${date}`;
  const logRef = doc(db, "activities", docId);

  const existing = await getDoc(logRef);
  const existingData = existing.exists() ? existing.data() : {};

  const logData = {
    userId,
    date,
    [logType]: { ...detailsData, emissions: parseFloat(emissions) },
    createdAt: existingData.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Preserve other log types if merging
  if (logType !== "travel" && existingData.travel) {
    logData.travel = existingData.travel;
  }
  if (logType !== "food" && existingData.food) {
    logData.food = existingData.food;
  }
  if (logType !== "energy" && existingData.energy) {
    logData.energy = existingData.energy;
  }

  // Recalculate total
  let total = 0;
  if (logData.travel) total += logData.travel.emissions || 0;
  if (logData.food) total += logData.food.emissions || 0;
  if (logData.energy) total += logData.energy.emissions || 0;
  logData.totalEmission = Math.round(total * 100) / 100;

  await setDoc(logRef, logData);
  return logData;
}

/**
 * Get a single day's log for a user.
 */
export async function getActivityLog(userId, date) {
  const docId = `${userId}_${date}`;
  const logRef = doc(db, "activities", docId);
  const snap = await getDoc(logRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * Get logs within a date range.
 */
export async function getActivityLogsInRange(userId, startDate, endDate) {
  const logsRef = collection(db, "activities");
  const q = query(
    logsRef,
    where("userId", "==", userId),
    where("date", ">=", startDate),
    where("date", "<=", endDate),
    orderBy("date", "asc")
  );

  const snapshot = await getDocs(q);
  const logs = [];
  snapshot.forEach((docSnap) => {
    logs.push({ id: docSnap.id, ...docSnap.data() });
  });
  return logs;
}

// ============================================================================
// SUGGESTIONS OPERATIONS
// ============================================================================

/**
 * Save AI-generated suggestions for a user on a given date.
 */
export async function saveSuggestions(userId, date, recommendations) {
  const docId = `${userId}_${date}`;
  const sugRef = doc(db, "suggestions", docId);
  const data = {
    userId,
    date,
    recommendations,
    createdAt: new Date().toISOString(),
  };
  await setDoc(sugRef, data);
  return data;
}

/**
 * Get cached suggestions for a user on a given date.
 */
export async function getSuggestions(userId, date) {
  const docId = `${userId}_${date}`;
  const sugRef = doc(db, "suggestions", docId);
  const snap = await getDoc(sugRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

// ============================================================================
// BADGES OPERATIONS
// ============================================================================

/**
 * Save badges for a user (replaces current list).
 */
export async function saveBadges(userId, badges) {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, { badges });
  return badges;
}

/**
 * Get user badges.
 */
export async function getUserBadges(userId) {
  const profile = await getUserProfile(userId);
  return profile ? profile.badges || [] : [];
}

// ============================================================================
// STREAK OPERATIONS
// ============================================================================

/**
 * Update user streak.
 */
export async function updateStreak(userId, streak) {
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, { streak: parseInt(streak, 10) });
  return streak;
}
