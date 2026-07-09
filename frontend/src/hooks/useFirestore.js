import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getUserProfile,
  updateUserProfile,
  getActivityLog,
  getActivityLogsInRange,
  saveActivityLog,
  getSuggestions as fetchCachedSuggestions,
  saveSuggestions,
} from "../services/firestore/firestoreService";

/**
 * Hook to manage user profile from Firestore.
 */
export function useUserProfile() {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!currentUser?.uid) {
      setProfile(null);
      setLoading(false);
      return;
    }
    try {
      const data = await getUserProfile(currentUser.uid);
      setProfile(data);
    } catch (err) {
      console.error("Failed to fetch user profile:", err);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (updates) => {
    if (!currentUser?.uid) return;
    await updateUserProfile(currentUser.uid, updates);
    setProfile((prev) => ({ ...prev, ...updates }));
  };

  return { profile, loading, updateProfile, refresh: fetchProfile };
}

/**
 * Hook to manage a single day's activity log.
 */
export function useActivityLog(date) {
  const { currentUser } = useAuth();
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchLog = useCallback(async () => {
    if (!currentUser?.uid || !date) {
      setLog(null);
      setLoading(false);
      return;
    }
    try {
      const data = await getActivityLog(currentUser.uid, date);
      setLog(data);
    } catch (err) {
      console.error("Failed to fetch activity log:", err);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid, date]);

  useEffect(() => {
    fetchLog();
  }, [fetchLog]);

  const saveLog = async (logType, detailsData, emissions) => {
    if (!currentUser?.uid) return;
    const result = await saveActivityLog(currentUser.uid, date, logType, detailsData, emissions);
    setLog(result);
    return result;
  };

  return { log, loading, saveLog, refresh: fetchLog };
}

/**
 * Hook to fetch activity logs in a date range.
 */
export function useActivityLogsInRange(startDate, endDate) {
  const { currentUser } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    if (!currentUser?.uid || !startDate || !endDate) {
      setLogs([]);
      setLoading(false);
      return;
    }
    try {
      const data = await getActivityLogsInRange(currentUser.uid, startDate, endDate);
      setLogs(data);
    } catch (err) {
      console.error("Failed to fetch activity logs range:", err);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid, startDate, endDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return { logs, loading, refresh: fetchLogs };
}
