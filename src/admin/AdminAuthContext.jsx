import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { supabase, isSupabaseConfigured, logAuditEvent } from '../lib/supabase';

// Master admin access password requested by owner
export const ADMIN_MASTER_PASSWORD = 'bb..99gg';

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const INACTIVITY_WARNING_MS = 28 * 60 * 1000; // 28 minutes (2 min warning)

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [adminRecord, setAdminRecord] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [warningSecondsLeft, setWarningSecondsLeft] = useState(120);

  const lastActivityRef = useRef(Date.now());

  // Check admin record in public.admins
  const verifyAdminStatus = useCallback(async (authUser) => {
    if (!authUser || !supabase) {
      setIsAdmin(false);
      setAdminRecord(null);
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('admins')
        .select('*')
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (error || !data) {
        console.warn('[AdminAuth] User not found in admins table:', error?.message);
        setIsAdmin(false);
        setAdminRecord(null);
        return false;
      }

      setIsAdmin(true);
      setAdminRecord(data);
      return true;
    } catch (err) {
      console.error('[AdminAuth] Error checking admin role:', err);
      setIsAdmin(false);
      setAdminRecord(null);
      return false;
    }
  }, []);

  // Initialize auth
  useEffect(() => {
    // Check if authenticated in current browser session
    const isAuth =
      sessionStorage.getItem('sunnybite_admin_auth') === 'true' ||
      localStorage.getItem('sunnybite_admin_auth') === 'true';

    if (isAuth) {
      const savedEmail =
        sessionStorage.getItem('sunnybite_admin_email') ||
        localStorage.getItem('sunnybite_admin_email') ||
        'owner@sunnybite.pk';

      const authenticatedUser = { id: 'admin-owner-id', email: savedEmail };
      setSession({ access_token: 'auth-active-token', user: authenticatedUser });
      setUser(authenticatedUser);
      setIsAdmin(true);
      setAdminRecord({ user_id: 'admin-owner-id', email: savedEmail, role: 'owner' });
      setLoading(false);
      return;
    }

    // If Supabase is configured, check live session
    if (isSupabaseConfigured() && supabase) {
      supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
        setSession(currentSession);
        setUser(currentSession?.user || null);
        if (currentSession?.user) {
          verifyAdminStatus(currentSession.user).finally(() => setLoading(false));
        } else {
          setLoading(false);
        }
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user || null);
        if (newSession?.user) {
          await verifyAdminStatus(newSession.user);
        } else {
          setIsAdmin(false);
          setAdminRecord(null);
        }
        setLoading(false);
      });

      return () => {
        subscription?.unsubscribe();
      };
    }

    setLoading(false);
  }, [verifyAdminStatus]);

  // Reset inactivity timer on user interaction
  const resetInactivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (showInactivityWarning) {
      setShowInactivityWarning(false);
      setWarningSecondsLeft(120);
    }
  }, [showInactivityWarning]);

  // Inactivity watchdog (auto-logout after 30 mins)
  useEffect(() => {
    if (!session || !isAdmin) return;

    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    const handleActivity = () => resetInactivity();

    activityEvents.forEach((evt) => window.addEventListener(evt, handleActivity, { passive: true }));

    const interval = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;

      if (elapsed >= INACTIVITY_TIMEOUT_MS) {
        logout();
        setShowInactivityWarning(false);
      } else if (elapsed >= INACTIVITY_WARNING_MS) {
        setShowInactivityWarning(true);
        const remaining = Math.max(0, Math.floor((INACTIVITY_TIMEOUT_MS - elapsed) / 1000));
        setWarningSecondsLeft(remaining);
      } else {
        setShowInactivityWarning(false);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      activityEvents.forEach((evt) => window.removeEventListener(evt, handleActivity));
    };
  }, [session, isAdmin, resetInactivity]);

  // Login action using master password "bb..99gg" or Supabase credentials
  const login = async (email, password, rememberMe = false) => {
    setAuthError(null);
    const trimmedEmail = email?.trim() || 'admin@sunnybite.pk';
    const trimmedPassword = password?.trim();

    // 1. Check Master Password "bb..99gg"
    if (trimmedPassword === ADMIN_MASTER_PASSWORD) {
      if (rememberMe) {
        localStorage.setItem('sunnybite_admin_auth', 'true');
        localStorage.setItem('sunnybite_admin_email', trimmedEmail);
      } else {
        sessionStorage.setItem('sunnybite_admin_auth', 'true');
        sessionStorage.setItem('sunnybite_admin_email', trimmedEmail);
      }

      const adminUser = { id: 'admin-owner-id', email: trimmedEmail };
      setSession({ access_token: 'auth-active-token', user: adminUser });
      setUser(adminUser);
      setIsAdmin(true);
      setAdminRecord({ user_id: 'admin-owner-id', email: trimmedEmail, role: 'owner' });

      await logAuditEvent({
        action: 'LOGIN',
        entityType: 'admin_session',
        entityId: 'admin-owner-id',
        newValue: { email: trimmedEmail, method: 'master_password' },
        userEmail: trimmedEmail,
      });

      lastActivityRef.current = Date.now();
      return { user: adminUser };
    }

    // 2. Check Supabase Auth if configured
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: trimmedPassword,
      });

      if (!error && data?.user) {
        const isVerifiedAdmin = await verifyAdminStatus(data.user);
        if (isVerifiedAdmin) {
          await logAuditEvent({
            action: 'LOGIN',
            entityType: 'admin_session',
            entityId: data.user.id,
            newValue: { email: data.user.email, method: 'supabase_auth' },
            userEmail: data.user.email,
          });
          lastActivityRef.current = Date.now();
          return data;
        } else {
          await supabase.auth.signOut();
          throw new Error('Access Denied: This email is not registered in the SunnyBite administrators list.');
        }
      }
    }

    // Invalid password
    throw new Error('Incorrect password. Please enter the valid admin password.');
  };

  // Logout action
  const logout = async () => {
    sessionStorage.removeItem('sunnybite_admin_auth');
    localStorage.removeItem('sunnybite_admin_auth');
    sessionStorage.removeItem('sunnybite_admin_email');
    localStorage.removeItem('sunnybite_admin_email');

    if (supabase && user) {
      try {
        await logAuditEvent({
          action: 'LOGOUT',
          entityType: 'admin_session',
          entityId: user.id,
          userEmail: user.email,
        });
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('[AdminAuth] Logout warning:', err);
      }
    }
    setSession(null);
    setUser(null);
    setIsAdmin(false);
    setAdminRecord(null);
    setShowInactivityWarning(false);
  };

  // Reset password email request
  const requestPasswordReset = async (email) => {
    if (!supabase) throw new Error('Supabase not configured.');
    return await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });
  };

  // Update password for currently authenticated user
  const updatePassword = async (newPassword) => {
    if (!supabase) throw new Error('Supabase not configured.');
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
    await logAuditEvent({
      action: 'UPDATE_PASSWORD',
      entityType: 'admin_account',
      entityId: user?.id,
      userEmail: user?.email,
    });
    return data;
  };

  const isDemoMode = !isSupabaseConfigured();

  const value = {
    session,
    user,
    adminRecord,
    isAdmin,
    role: adminRecord?.role || 'owner',
    isOwner: true,
    isDemoMode,
    loading,
    authError,
    showInactivityWarning,
    warningSecondsLeft,
    resetInactivity,
    login,
    logout,
    requestPasswordReset,
    updatePassword,
    refreshAdminStatus: () => user && verifyAdminStatus(user),
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
