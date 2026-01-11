'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { getDeviceFingerprint, encryptData } from '@/lib/utils';

export default function SetupPage() {
  const t = useTranslations('setup');
  const tLang = useTranslations('language');
  const locale = useLocale();
  const router = useRouter();

  const [name, setName] = useState('');
  const [emergencyEmail, setEmergencyEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user already exists
    checkExistingUser();
  }, []);

  async function checkExistingUser() {
    try {
      const fingerprint = await getDeviceFingerprint();
      const response = await fetch(`/api/user?deviceFingerprint=${encodeURIComponent(fingerprint)}`);
      const data = await response.json();

      if (data.user) {
        // User exists, redirect to home
        router.push(`/${locale}`);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!name.trim() || !emergencyEmail.trim()) {
      setError(t('error'));
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emergencyEmail)) {
      setError(t('error'));
      return;
    }

    try {
      setSubmitting(true);
      const fingerprint = await getDeviceFingerprint();

      // Encrypt sensitive data
      const encryptedName = encryptData(name.trim());
      const encryptedEmail = encryptData(emergencyEmail.trim());

      const response = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceFingerprint: fingerprint,
          name: encryptedName,
          emergencyEmail: encryptedEmail,
          language: locale,
        }),
      });

      const data = await response.json();

      if (data.user) {
        // Success, redirect to home
        router.push(`/${locale}`);
      } else {
        setError(data.error || t('error'));
      }
    } catch (error) {
      console.error('Setup error:', error);
      setError(t('error'));
    } finally {
      setSubmitting(false);
    }
  }

  function switchLanguage() {
    const newLocale = locale === 'zh' ? 'en' : 'zh';
    router.push(`/${newLocale}/setup`);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Language Switcher */}
      <div className="absolute top-4 right-4">
        <button
          onClick={switchLanguage}
          className="text-sm text-gray-600 hover:text-gray-900"
        >
          {tLang('zh')} / {tLang('en')}
        </button>
      </div>

      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {locale === 'zh' ? '平安签到' : 'Safety Check-in'}
          </h1>
          <p className="text-gray-600">
            {locale === 'zh'
              ? '为独居人群打造的轻量化安全工具'
              : 'A lightweight safety tool for solo-living individuals'}
          </p>
        </div>

        {/* Setup Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('title')}</h2>
          <p className="text-gray-600 mb-6 text-sm">{t('subtitle')}</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Input */}
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Emergency Email Input */}
            <div>
              <label
                htmlFor="emergencyEmail"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {t('emergencyEmail.label')}
              </label>
              <input
                type="email"
                id="emergencyEmail"
                value={emergencyEmail}
                onChange={(e) => setEmergencyEmail(e.target.value)}
                placeholder={t('emergencyEmail.placeholder')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
              <p className="mt-2 text-xs text-gray-500">{t('emergencyEmail.help')}</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className={`
                w-full py-3 px-4 rounded-lg font-medium text-white
                transition-colors duration-200
                ${
                  submitting
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
                }
              `}
            >
              {submitting ? t('processing') : t('submit')}
            </button>
          </form>
        </div>

        {/* Privacy Note */}
        <p className="text-center text-xs text-gray-500 mt-6">
          {locale === 'zh'
            ? '您的信息将被加密存储，仅用于安全监测和紧急联系。'
            : 'Your information will be encrypted and used only for safety monitoring and emergency contact.'}
        </p>
      </div>
    </div>
  );
}
