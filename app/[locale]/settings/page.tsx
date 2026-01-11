'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { getDeviceFingerprint, encryptData, decryptData, formatDateTime } from '@/lib/utils';
import Link from 'next/link';

export default function SettingsPage() {
  const t = useTranslations('settings');
  const tNav = useTranslations('nav');
  const locale = useLocale();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [name, setName] = useState('');
  const [emergencyEmail, setEmergencyEmail] = useState('');
  const [checkins, setCheckins] = useState<any[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  async function loadUserData() {
    try {
      const fingerprint = await getDeviceFingerprint();

      // Fetch user data
      const userResponse = await fetch(`/api/user?deviceFingerprint=${encodeURIComponent(fingerprint)}`);
      const userData = await userResponse.json();

      if (userData.user) {
        setUser(userData.user);
        // Decrypt data for display
        try {
          setName(decryptData(userData.user.name));
          setEmergencyEmail(decryptData(userData.user.emergency_email));
        } catch (error) {
          console.error('Decryption error:', error);
          setName(userData.user.name);
          setEmergencyEmail(userData.user.emergency_email);
        }

        // Fetch check-in history
        const checkinsResponse = await fetch(
          `/api/checkin?deviceFingerprint=${encodeURIComponent(fingerprint)}&limit=30`
        );
        const checkinsData = await checkinsResponse.json();
        if (checkinsData.checkins) {
          setCheckins(checkinsData.checkins);
        }
      } else {
        // No user found, redirect to setup
        router.push(`/${locale}/setup`);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!name.trim() || !emergencyEmail.trim()) {
      alert(t('error'));
      return;
    }

    try {
      setSaving(true);
      const fingerprint = await getDeviceFingerprint();

      // Encrypt data
      const encryptedName = encryptData(name.trim());
      const encryptedEmail = encryptData(emergencyEmail.trim());

      const response = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceFingerprint: fingerprint,
          name: encryptedName,
          emergencyEmail: encryptedEmail,
        }),
      });

      const data = await response.json();

      if (data.user) {
        alert(t('saved'));
      } else {
        alert(t('error'));
      }
    } catch (error) {
      console.error('Save error:', error);
      alert(t('error'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      const fingerprint = await getDeviceFingerprint();

      const response = await fetch(`/api/user?deviceFingerprint=${encodeURIComponent(fingerprint)}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        // Clear local storage
        localStorage.clear();
        // Redirect to setup
        router.push(`/${locale}/setup`);
      } else {
        alert(t('error'));
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert(t('error'));
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={`/${locale}`} className="text-blue-600 hover:text-blue-700">
            ← {tNav('home')}
          </Link>
          <h1 className="text-xl font-bold text-gray-900">{t('title')}</h1>
          <div className="w-16"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* User Info Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {locale === 'zh' ? '基本信息' : 'Basic Information'}
            </h2>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('name.label')}
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('name.placeholder')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Emergency Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  {t('emergencyEmail.label')}
                </label>
                <input
                  type="email"
                  id="email"
                  value={emergencyEmail}
                  onChange={(e) => setEmergencyEmail(e.target.value)}
                  placeholder={t('emergencyEmail.placeholder')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={saving}
                className={`
                  w-full py-2 px-4 rounded-lg font-medium text-white
                  transition-colors duration-200
                  ${
                    saving
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                  }
                `}
              >
                {saving ? t('saving') : t('save')}
              </button>
            </div>
          </div>

          {/* Check-in History Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('history.title')}</h2>

            {checkins.length > 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-500 mb-3">{t('history.last30days')}</p>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {checkins.map((checkin) => (
                    <div
                      key={checkin.id}
                      className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded"
                    >
                      <span className="text-sm text-gray-700">
                        {formatDateTime(new Date(checkin.checked_in_at), locale as 'zh' | 'en')}
                      </span>
                      <span className="text-xs text-green-600">✓</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">{t('history.empty')}</p>
            )}
          </div>

          {/* Danger Zone */}
          <div className="bg-white rounded-lg shadow p-6 border-2 border-red-200">
            <h2 className="text-lg font-semibold text-red-600 mb-4">
              {locale === 'zh' ? '危险操作' : 'Danger Zone'}
            </h2>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                {t('deleteAccount')}
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-700">{t('deleteConfirm')}</p>
                <div className="flex gap-3">
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                  >
                    {t('delete')}
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                  >
                    {t('cancel')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Privacy Policy Link */}
          <div className="text-center">
            <a href="#" className="text-sm text-blue-600 hover:text-blue-700">
              {t('privacy')}
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
