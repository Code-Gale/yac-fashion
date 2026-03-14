'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastContext';
import { cn } from '@/lib/utils';

function getPasswordStrength(pwd: string) {
  if (!pwd) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
  if (/\d/.test(pwd)) score++;
  if (/[^a-zA-Z0-9]/.test(pwd)) score++;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const colors = ['', 'bg-error', 'bg-warning', 'bg-accent', 'bg-success', 'bg-success'];
  return { score, label: labels[score], color: colors[score] };
}

export default function ProfilePage() {
  const { user, setAuth } = useAuth();
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [deactivateModal, setDeactivateModal] = useState(false);

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n: string) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '?';

  const pwStrength = getPasswordStrength(passwordForm.newPassword);
  const passwordsMatch =
    passwordForm.newPassword && passwordForm.newPassword === passwordForm.confirmPassword;
  const canSavePassword =
    passwordForm.currentPassword &&
    passwordForm.newPassword &&
    passwordForm.newPassword.length >= 8 &&
    passwordsMatch;

  const saveProfile = async () => {
    if (!editName.trim()) return;
    setSavingProfile(true);
    try {
      const { data } = await api.put('/account/profile', { name: editName.trim() });
      const updated = data?.data?.user ?? data?.user;
      if (updated) {
        const state = useAuthStore.getState();
        setAuth(updated, state.accessToken, state.refreshToken);
      }
      toast('Profile updated', 'success');
      setEditMode(false);
    } catch (err: any) {
      toast(err?.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async () => {
    if (!canSavePassword) return;
    setSavingPassword(true);
    try {
      await api.put('/account/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast('Password updated', 'success');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast(err?.response?.data?.message || 'Failed to update password', 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl lg:text-3xl text-primary">Profile Settings</h1>

      <section className="mt-8 bg-surface border rounded-lg p-6">
        <h2 className="font-display text-lg text-primary mb-6">Personal Information</h2>
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-accent text-white flex items-center justify-center font-display font-semibold text-2xl">
              {initials}
            </div>
            <button
              type="button"
              disabled
              title="Coming soon"
              className="mt-2 text-sm text-text-muted cursor-not-allowed"
            >
              Change Photo
            </button>
          </div>
          <div className="flex-1 space-y-4">
            {editMode ? (
              <>
                <div>
                  <label htmlFor="profile-name" className="block text-sm font-medium text-primary mb-1">
                    Name
                  </label>
                  <input
                    id="profile-name"
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-4 py-3 border border-border rounded-lg bg-bg text-primary focus:outline-none focus:ring-2 focus:ring-accent min-h-[44px]"
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="accent"
                    onClick={saveProfile}
                    disabled={savingProfile || !editName.trim()}
                    loading={savingProfile}
                    className="min-h-[44px]"
                  >
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditMode(false);
                      setEditName(user?.name || '');
                    }}
                    className="min-h-[44px]"
                  >
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-sm text-text-muted">Name</p>
                  <p className="font-medium text-primary">{user?.name || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-text-muted">Email</p>
                  <p className="font-medium text-primary">{user?.email || '—'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditMode(true);
                    setEditName(user?.name || '');
                  }}
                  className="min-h-[44px] px-4 py-2 text-sm font-medium text-accent hover:bg-accent-light rounded-md transition-colors"
                >
                  Edit
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="mt-8 bg-surface border rounded-lg p-6">
        <h2 className="font-display text-lg text-primary mb-6">Password</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="current-pw" className="block text-sm font-medium text-primary mb-1">
              Current Password
            </label>
            <input
              id="current-pw"
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm((f) => ({ ...f, currentPassword: e.target.value }))
              }
              className="w-full px-4 py-3 border border-border rounded-lg bg-bg text-primary focus:outline-none focus:ring-2 focus:ring-accent min-h-[44px]"
            />
          </div>
          <div>
            <label htmlFor="new-pw" className="block text-sm font-medium text-primary mb-1">
              New Password
            </label>
            <input
              id="new-pw"
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) =>
                setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))
              }
              className="w-full px-4 py-3 border border-border rounded-lg bg-bg text-primary focus:outline-none focus:ring-2 focus:ring-accent min-h-[44px]"
            />
            {passwordForm.newPassword && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all', pwStrength.color)}
                    style={{ width: `${(pwStrength.score / 5) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-text-muted">{pwStrength.label}</span>
              </div>
            )}
          </div>
          <div>
            <label htmlFor="confirm-pw" className="block text-sm font-medium text-primary mb-1">
              Confirm Password
            </label>
            <input
              id="confirm-pw"
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) =>
                setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))
              }
              className="w-full px-4 py-3 border border-border rounded-lg bg-bg text-primary focus:outline-none focus:ring-2 focus:ring-accent min-h-[44px]"
            />
            {passwordForm.confirmPassword && !passwordsMatch && (
              <p className="mt-1 text-xs text-error">Passwords do not match</p>
            )}
          </div>
          <Button
            variant="accent"
            onClick={savePassword}
            disabled={!canSavePassword || savingPassword}
            loading={savingPassword}
            className="min-h-[44px]"
          >
            Save Password
          </Button>
        </div>
      </section>

      <section className="mt-8 pt-8 border-t border-border">
        <button
          type="button"
          onClick={() => setDeactivateModal(true)}
          className="text-error hover:underline text-sm font-medium"
        >
          Deactivate Account
        </button>
      </section>

      <Modal
        open={deactivateModal}
        onClose={() => setDeactivateModal(false)}
        title="Deactivate Account"
      >
        <p className="text-text-muted mb-6">
          This action cannot be undone. Your account and data will be permanently removed.
        </p>
        <div className="flex gap-3">
          <Button
            variant="danger"
            onClick={() => {
              setDeactivateModal(false);
              toast('Account deactivation is not yet available', 'info');
            }}
            className="min-h-[44px]"
          >
            Deactivate
          </Button>
          <Button
            variant="outline"
            onClick={() => setDeactivateModal(false)}
            className="min-h-[44px]"
          >
            Cancel
          </Button>
        </div>
      </Modal>
    </div>
  );
}
