import React, { useState, useEffect } from 'react';
import { useAdminAuth } from '../AdminAuthContext';
import { supabase, isSupabaseConfigured, logAuditEvent } from '../../lib/supabase';

export function SecurityAccounts() {
  const { user, isOwner, updatePassword, logout } = useAdminAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Editors list
  const [editors, setEditors] = useState([]);
  const [newEditorEmail, setNewEditorEmail] = useState('');
  const [newEditorRole, setNewEditorRole] = useState('editor');
  const [feedback, setFeedback] = useState(null);

  const showToast = (msg, isErr = false) => {
    setFeedback({ msg, isErr });
    setTimeout(() => setFeedback(null), 3500);
  };

  const loadEditors = async () => {
    if (!isSupabaseConfigured() || !supabase) {
      setEditors([
        {
          user_id: user?.id || 'demo-admin-id',
          email: user?.email || 'admin@sunnybite.com',
          role: 'owner',
          created_at: new Date().toISOString(),
        },
      ]);
      return;
    }

    try {
      const { data, error } = await supabase.from('admins').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      setEditors(data || []);
    } catch (err) {
      showToast(err.message, true);
    }
  };

  useEffect(() => {
    loadEditors();
  }, []);

  // Update password handler
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      showToast('Password must be at least 8 characters long.', true);
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match.', true);
      return;
    }

    setPasswordLoading(true);
    try {
      await updatePassword(newPassword);
      setNewPassword('');
      setConfirmPassword('');
      showToast('Password changed successfully! Keep it safe.');
    } catch (err) {
      showToast(err.message, true);
    } finally {
      setPasswordLoading(false);
    }
  };

  // Add editor (Owner only)
  const handleAddEditor = async (e) => {
    e.preventDefault();
    if (!newEditorEmail.trim()) return;

    if (!isSupabaseConfigured() || !supabase) {
      setEditors([
        ...editors,
        {
          user_id: `editor-${Date.now()}`,
          email: newEditorEmail.trim().toLowerCase(),
          role: newEditorRole,
          created_at: new Date().toISOString(),
        },
      ]);
      setNewEditorEmail('');
      showToast('Editor added locally (offline)');
      return;
    }

    try {
      // NOTE: In Supabase, the user must first create an auth.users account (or invite via Supabase Dashboard -> Auth -> Users)
      // and their UUID is mapped to public.admins.
      showToast(
        'Note: First create this user in Supabase Dashboard -> Authentication -> Users, then add them to admins.',
        false
      );
    } catch (err) {
      showToast(err.message, true);
    }
  };

  // Remove editor
  const handleRemoveEditor = async (editorId) => {
    if (!isSupabaseConfigured() || !supabase) {
      setEditors(editors.filter((e) => e.user_id !== editorId));
      showToast('Editor removed locally');
      return;
    }

    try {
      const { error } = await supabase.from('admins').delete().eq('user_id', editorId);
      if (error) throw error;

      await logAuditEvent({
        action: 'REMOVE_ADMIN',
        entityType: 'admins',
        entityId: editorId,
      });

      showToast('Editor access removed.');
      loadEditors();
    } catch (err) {
      showToast(err.message, true);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-warm-elevated text-xs sm:text-sm font-semibold flex items-center gap-2 ${
            feedback.isErr ? 'bg-error text-white' : 'bg-secondary text-on-secondary'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {feedback.isErr ? 'error' : 'check_circle'}
          </span>
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="font-headline-lg text-2xl sm:text-3xl text-[#243022] font-semibold">
          Security &amp; Administrator Accounts
        </h1>
        <p className="font-body-md text-on-surface-variant text-xs sm:text-sm">
          Update your administrative password, manage editor staff permissions, and verify session security.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* 1. Change Password */}
        <div className="p-6 rounded-3xl bg-[#FDFAF3] border border-white/80 shadow-warm-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-surface-container">
            <span className="material-symbols-outlined text-secondary text-[22px]">lock_reset</span>
            <h2 className="font-headline-sm text-base font-bold text-[#243022]">
              Change Password
            </h2>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-on-surface">Logged In Account</label>
              <input
                type="text"
                readOnly
                value={user?.email || 'admin@sunnybite.com'}
                className="w-full bg-surface-container-low p-2.5 rounded-xl border border-surface-container text-on-surface-variant"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-on-surface">New Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters..."
                className="w-full bg-surface-container-lowest p-2.5 rounded-xl border border-surface-container text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-on-surface">Confirm New Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password..."
                className="w-full bg-surface-container-lowest p-2.5 rounded-xl border border-surface-container text-xs"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full py-3 rounded-full bg-secondary text-on-secondary font-label-lg text-xs font-semibold shadow-xs hover:opacity-90 disabled:opacity-50"
              >
                {passwordLoading ? 'Updating Password...' : 'Save New Password'}
              </button>
            </div>
          </form>
        </div>

        {/* 2. 2-Step Verification (MFA) Info Card */}
        <div className="p-6 rounded-3xl bg-[#FDFAF3] border border-white/80 shadow-warm-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-surface-container">
            <span className="material-symbols-outlined text-primary text-[22px]">security</span>
            <h2 className="font-headline-sm text-base font-bold text-[#243022]">
              Two-Factor Authentication (2FA / TOTP)
            </h2>
          </div>

          <div className="p-4 rounded-2xl bg-surface-container-low space-y-2 text-xs text-on-surface-variant">
            <p className="font-semibold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-secondary">verified</span>
              <span>Available on Supabase Auth</span>
            </p>
            <p className="leading-relaxed">
              For maximum security, you can enable TOTP Authenticator apps (Google Authenticator, Apple Passwords, or 1Password) in your Supabase project under:
            </p>
            <div className="p-2.5 rounded-xl bg-surface-container-lowest font-mono text-[11px] text-on-surface">
              Supabase Dashboard → Authentication → Providers → Phone / TOTP
            </div>
            <p className="text-[11px] text-outline pt-1">
              Once enabled, you will be prompted for a 6-digit code upon signing in.
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            className="w-full py-2.5 rounded-full bg-error-container text-error text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            Sign Out of Current Session
          </button>
        </div>

        {/* 3. Authorized Administrators & Editors List (Full width) */}
        <div className="p-6 rounded-3xl bg-[#FDFAF3] border border-white/80 shadow-warm-sm space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-surface-container">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-[22px]">group</span>
              <h2 className="font-headline-sm text-base font-bold text-[#243022]">
                Authorized Administrators ({editors.length})
              </h2>
            </div>
            <span className="text-xs text-secondary font-semibold">
              {isOwner ? 'You are logged in as Owner' : 'Logged in as Editor'}
            </span>
          </div>

          <p className="text-xs text-on-surface-variant">
            Only accounts explicitly listed in the <code className="bg-surface-container px-1.5 py-0.5 rounded font-mono">admins</code> table can modify restaurant data. Non-admins cannot read inbox submissions or make changes.
          </p>

          <div className="space-y-2.5">
            {editors.map((ed) => (
              <div
                key={ed.user_id}
                className="p-3.5 rounded-2xl bg-surface-container-low/70 border border-surface-container/60 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary-fixed text-secondary flex items-center justify-center font-bold">
                    {ed.email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-on-surface">{ed.email}</p>
                    <p className="text-[11px] text-on-surface-variant">
                      Role: <span className="capitalize font-semibold text-secondary">{ed.role}</span>
                    </p>
                  </div>
                </div>

                {isOwner && ed.user_id !== user?.id && (
                  <button
                    type="button"
                    onClick={() => handleRemoveEditor(ed.user_id)}
                    className="px-3 py-1.5 rounded-full bg-error-container text-error text-xs font-semibold hover:bg-error hover:text-white transition-colors"
                  >
                    Revoke Access
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SecurityAccounts;
