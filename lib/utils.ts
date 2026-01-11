import FingerprintJS from '@fingerprintjs/fingerprintjs';
import CryptoJS from 'crypto-js';

// ============================================
// DEVICE FINGERPRINTING
// ============================================
// Generates a unique device fingerprint for no-login authentication

let fpPromise: Promise<any> | null = null;

export async function getDeviceFingerprint(): Promise<string> {
  try {
    // Initialize fingerprint library (cached after first call)
    if (!fpPromise) {
      fpPromise = FingerprintJS.load();
    }

    const fp = await fpPromise;
    const result = await fp.get();

    return result.visitorId;
  } catch (error) {
    console.error('Error generating device fingerprint:', error);
    // Fallback to a combination of browser/localStorage ID
    return getFallbackFingerprint();
  }
}

function getFallbackFingerprint(): string {
  // Check if we already have a stored fingerprint
  const stored = localStorage.getItem('device_fingerprint');
  if (stored) {
    return stored;
  }

  // Generate a new UUID-like fingerprint
  const fallbackId = generateUUID();
  localStorage.setItem('device_fingerprint', fallbackId);

  return fallbackId;
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ============================================
// CLIENT-SIDE ENCRYPTION
// ============================================
// Encrypts sensitive data before sending to server

const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'safety-checkin-default-key-change-in-production';

export function encryptData(data: string): string {
  try {
    return CryptoJS.AES.encrypt(data, ENCRYPTION_KEY).toString();
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

export function decryptData(encryptedData: string): string {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

// ============================================
// LOCAL STORAGE HELPERS
// ============================================

export function saveUserToLocalStorage(user: {
  id: string;
  name: string;
  emergencyEmail: string;
  language: string;
}) {
  try {
    localStorage.setItem('user', JSON.stringify(user));
  } catch (error) {
    console.error('Error saving user to localStorage:', error);
  }
}

export function getUserFromLocalStorage(): {
  id: string;
  name: string;
  emergencyEmail: string;
  language: string;
} | null {
  try {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error reading user from localStorage:', error);
    return null;
  }
}

export function clearUserFromLocalStorage() {
  try {
    localStorage.removeItem('user');
    localStorage.removeItem('device_fingerprint');
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
}

// ============================================
// DATE UTILITIES
// ============================================

export function formatRelativeTime(date: Date, locale: 'zh' | 'en'): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return locale === 'zh' ? '今天' : 'Today';
  } else if (diffDays === 1) {
    return locale === 'zh' ? '昨天' : 'Yesterday';
  } else {
    return locale === 'zh' ? `${diffDays} 天前` : `${diffDays} days ago`;
  }
}

export function formatDateTime(date: Date, locale: 'zh' | 'en'): string {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };

  return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', options).format(date);
}
