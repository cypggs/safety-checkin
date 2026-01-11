'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { getDeviceFingerprint, formatRelativeTime, formatDateTime } from '@/lib/utils';
import Link from 'next/link';

export default function HomePage() {
  const t = useTranslations('checkin');
  const tNav = useTranslations('nav');
  const tLang = useTranslations('language');
  const locale = useLocale();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [lastCheckin, setLastCheckin] = useState<Date | null>(null);
  const [streak, setStreak] = useState(0);
  const [checkedInToday, setCheckedInToday] = useState(false);

  useEffect(() => {
    initializeUser();
  }, []);

  async function initializeUser() {
    try {
      const fingerprint = await getDeviceFingerprint();

      // Fetch user data
      const response = await fetch(`/api/user?deviceFingerprint=${encodeURIComponent(fingerprint)}`);
      const data = await response.json();

      if (data.user) {
        setUser(data.user);
        if (data.user.last_checkin_at) {
          const lastCheckinDate = new Date(data.user.last_checkin_at);
          setLastCheckin(lastCheckinDate);
          setStreak(data.user.checkin_streak || 0);

          // Check if checked in today
          const now = new Date();
          const isSameDay =
            lastCheckinDate.getDate() === now.getDate() &&
            lastCheckinDate.getMonth() === now.getMonth() &&
            lastCheckinDate.getFullYear() === now.getFullYear();

          setCheckedInToday(isSameDay);
        }
      } else {
        // No user found, redirect to setup
        router.push(`/${locale}/setup`);
      }
    } catch (error) {
      console.error('Error initializing user:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckin() {
    if (checking || checkedInToday) return;

    try {
      setChecking(true);
      const fingerprint = await getDeviceFingerprint();

      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceFingerprint: fingerprint }),
      });

      const data = await response.json();

      if (data.success) {
        setLastCheckin(new Date());
        setStreak(data.streak);
        setCheckedInToday(true);
      } else {
        alert(t('error'));
      }
    } catch (error) {
      console.error('Check-in error:', error);
      alert(t('error'));
    } finally {
      setChecking(false);
    }
  }

  function switchLanguage() {
    const newLocale = locale === 'zh' ? 'en' : 'zh';
    router.push(`/${newLocale}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">
            {locale === 'zh' ? '平安签到' : 'Safety Check-in'}
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={switchLanguage}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              {tLang('zh')} / {tLang('en')}
            </button>
            <Link
              href={`/${locale}/settings`}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              {tNav('settings')}
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md text-center space-y-8">
          {/* Check-in Button */}
          <div>
            <button
              onClick={handleCheckin}
              disabled={checking || checkedInToday}
              className={`
                w-64 h-64 mx-auto rounded-full text-2xl font-bold shadow-2xl
                transition-all duration-300 transform hover:scale-105 active:scale-95
                ${
                  checkedInToday
                    ? 'bg-green-500 text-white cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                }
                ${checking ? 'opacity-50 cursor-wait' : ''}
              `}
            >
              {checking
                ? locale === 'zh'
                  ? '签到中...'
                  : 'Checking in...'
                : checkedInToday
                ? t('buttonChecked')
                : t('button')}
            </button>
          </div>

          {/* Status Info */}
          <div className="space-y-2 text-gray-600">
            {lastCheckin && (
              <>
                <p className="text-sm">
                  {t('lastCheckin')}:{' '}
                  <span className="font-medium text-gray-900">
                    {formatRelativeTime(lastCheckin, locale as 'zh' | 'en')}
                  </span>
                </p>
                {streak > 0 && (
                  <p className="text-sm">
                    <span className="font-medium text-blue-600">
                      {t('streak', { days: streak })}
                    </span>
                  </p>
                )}
              </>
            )}
            {!lastCheckin && (
              <p className="text-sm text-gray-500">{t('never')}</p>
            )}
          </div>

          {/* Reminder Text */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-gray-700">
            <p>{t('reminder')}</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-gray-500">
        <p>
          {locale === 'zh'
            ? '为独居人群打造的轻量化安全工具'
            : 'A lightweight safety tool for solo-living individuals'}
        </p>
      </footer>
    </div>
  );
}
