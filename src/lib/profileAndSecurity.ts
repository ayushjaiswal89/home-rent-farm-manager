import { FarmerProfile, SecuritySettings, FarmTask, AccountAuth } from './types';

export const PROFILE_STORAGE_KEY = 'sk-farmer-profile';
export const SECURITY_STORAGE_KEY = 'sk-security-settings';
export const BACKUP_TIMESTAMP_KEY = 'sk-last-backup-timestamp';
export const TASKS_STORAGE_KEY = 'sk-farm-tasks';

export const DEFAULT_FARMER_PROFILE: FarmerProfile = {
  name: '',
  email: '',
  phone: '',
  village: '',
  tehsil: '',
  district: '',
  state: '',
  avatarUrl: '',
};

export const DEFAULT_FARM_TASKS: FarmTask[] = [];

export function getFarmTasks(): FarmTask[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(TASKS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Error reading tasks:', e);
  }
  return [];
}

export function saveFarmTasks(tasks: FarmTask[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.error('Error saving tasks:', e);
  }
}

// Phone & PIN format validations
export function isValidPhone(phone: string): boolean {
  const clean = (phone || '').trim().replace(/\D/g, '');
  return clean.length === 10 && /^[6-9]\d{9}$/.test(clean);
}

export function isValidPin(pin: string): boolean {
  const clean = (pin || '').trim();
  return clean.length === 4 && /^\d{4}$/.test(clean);
}

// Legacy deterministic digest for compatibility. This is NOT cryptographic password hashing.
const PIN_SALT = 'smart-khata-kisan-salt-v2';

export function hashPin(pin: string): string {
  const clean = (pin || '').trim();
  const input = `${PIN_SALT}:${clean}`;
  let h1 = 0xdeadbeef ^ 0;
  let h2 = 0x41c6ce57 ^ 0;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const part1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const part2 = (h2 >>> 0).toString(16).padStart(8, '0');

  let h3 = 0x85ebca6b ^ 0;
  let h4 = 0xc2b2ae35 ^ 0;
  const input2 = `${part1}:${input}:${part2}`;
  for (let i = 0; i < input2.length; i++) {
    const ch = input2.charCodeAt(i);
    h3 = Math.imul(h3 ^ ch, 3266489909);
    h4 = Math.imul(h4 ^ ch, 2654435761);
  }
  const part3 = (h3 >>> 0).toString(16).padStart(8, '0');
  const part4 = (h4 >>> 0).toString(16).padStart(8, '0');

  return `sk_hash_${part1}${part2}${part3}${part4}`;
}

export const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
  pinHash: hashPin('1234'),
  isLockEnabled: false,
};

export function getFarmerProfile(): FarmerProfile {
  if (typeof window === 'undefined') return DEFAULT_FARMER_PROFILE;
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.name === 'string') {
        // If legacy demo profile, reset
        if (parsed.email === 'kisan@gmail.com' && parsed.phone === '9876543210') {
          return DEFAULT_FARMER_PROFILE;
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading profile:', e);
  }
  return DEFAULT_FARMER_PROFILE;
}

export function saveFarmerProfile(profile: FarmerProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Error saving profile:', e);
  }
}

export function getSecuritySettings(): SecuritySettings {
  if (typeof window === 'undefined') return DEFAULT_SECURITY_SETTINGS;
  try {
    const raw = localStorage.getItem(SECURITY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed) {
        // Migrate legacy plain pin to pinHash if needed
        if (parsed.pin && !parsed.pinHash) {
          parsed.pinHash = hashPin(parsed.pin);
          delete parsed.pin;
        }
        if (typeof parsed.pinHash === 'string') {
          return parsed as SecuritySettings;
        }
      }
    }
  } catch (e) {
    console.error('Error reading security settings:', e);
  }
  return DEFAULT_SECURITY_SETTINGS;
}

export function saveSecuritySettings(settings: SecuritySettings): void {
  if (typeof window === 'undefined') return;
  try {
    const toSave: SecuritySettings = {
      isLockEnabled: Boolean(settings.isLockEnabled),
      pinHash: settings.pinHash || (settings.pin ? hashPin(settings.pin) : hashPin('1234')),
      recoveryQuestion: settings.recoveryQuestion,
      recoveryAnswer: settings.recoveryAnswer,
    };
    localStorage.setItem(SECURITY_STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.error('Error saving security settings:', e);
  }
}

export function getLastBackupTimestamp(): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(BACKUP_TIMESTAMP_KEY);
    return raw ? Number(raw) : null;
  } catch {
    return null;
  }
}

export function recordBackupTimestamp(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(BACKUP_TIMESTAMP_KEY, String(Date.now()));
  } catch {}
}

export const ACCOUNT_AUTH_STORAGE_KEY = 'sk-account-auth';
export const LOGIN_STATUS_STORAGE_KEY = 'sk-is-logged-in';
export const GUEST_STATUS_STORAGE_KEY = 'sk-is-guest-mode';

export function isGuestMode(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(GUEST_STATUS_STORAGE_KEY) === 'true';
}

export function startGuestSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(GUEST_STATUS_STORAGE_KEY, 'true');
  localStorage.setItem(LOGIN_STATUS_STORAGE_KEY, 'true');
}

export function getAccountAuth(): AccountAuth | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ACCOUNT_AUTH_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.phone === 'string') {
        // Migrate legacy plain pin to pinHash if needed
        if (parsed.pin && !parsed.pinHash) {
          parsed.pinHash = hashPin(parsed.pin);
          delete parsed.pin;
          saveAccountAuth(parsed);
        }
        if (typeof parsed.pinHash === 'string') {
          return parsed as AccountAuth;
        }
      }
    }
  } catch (e) {
    console.error('Error reading account auth:', e);
  }
  return null;
}

export function saveAccountAuth(auth: AccountAuth): void {
  if (typeof window === 'undefined') return;
  try {
    // Ensure plaintext pin is never written
    const safeAuth: AccountAuth = {
      phone: auth.phone.trim().replace(/\D/g, ''),
      pinHash: auth.pinHash || hashPin('1234'),
      name: auth.name.trim(),
      isRegistered: true,
      securityQuestion: auth.securityQuestion,
      securityAnswerHash: auth.securityAnswerHash,
      createdAt: auth.createdAt || new Date().toISOString(),
    };
    localStorage.setItem(ACCOUNT_AUTH_STORAGE_KEY, JSON.stringify(safeAuth));
  } catch (e) {
    console.error('Error saving account auth:', e);
  }
}

export function registerNewAccount(params: {
  name: string;
  phone: string;
  pin: string;
  village?: string;
  district?: string;
  state?: string;
}): { success: boolean; error?: string; account?: AccountAuth } {
  const cleanName = (params.name || '').trim();
  const cleanPhone = (params.phone || '').trim().replace(/\D/g, '');
  const cleanPin = (params.pin || '').trim();

  if (!cleanName) {
    return { success: false, error: 'invalid_name' };
  }
  if (!isValidPhone(cleanPhone)) {
    return { success: false, error: 'invalid_phone' };
  }
  if (!isValidPin(cleanPin)) {
    return { success: false, error: 'invalid_pin' };
  }

  // Do not silently replace an existing account/PIN on this device.
  // This is a single-device local account, not a server-backed identity.
  const existingAccount = getAccountAuth();
  if (existingAccount?.isRegistered) {
    return { success: false, error: 'account_exists' };
  }

  // Legacy deterministic PIN digest retained for compatibility; this is NOT
  // a password-grade hash and must not be described as strong authentication.
  const hashedPin = hashPin(cleanPin);

  const auth: AccountAuth = {
    phone: cleanPhone,
    pinHash: hashedPin,
    name: cleanName,
    isRegistered: true,
    createdAt: new Date().toISOString(),
  };

  saveAccountAuth(auth);

  // Sync with profile
  const currentProfile = getFarmerProfile();
  const updatedProfile: FarmerProfile = {
    ...currentProfile,
    name: cleanName,
    phone: cleanPhone,
    email: currentProfile.email || `${cleanName.toLowerCase().replace(/\s+/g, '')}@gmail.com`,
    village: params.village?.trim() || currentProfile.village || '',
    district: params.district?.trim() || currentProfile.district || '',
    state: params.state?.trim() || currentProfile.state || 'मध्य प्रदेश',
  };
  saveFarmerProfile(updatedProfile);

  // Sync security settings with hashed PIN
  const currentSecurity = getSecuritySettings();
  saveSecuritySettings({
    ...currentSecurity,
    pinHash: hashedPin,
  });

  if (typeof window !== 'undefined') {
    localStorage.setItem(LOGIN_STATUS_STORAGE_KEY, 'true');
    localStorage.removeItem(GUEST_STATUS_STORAGE_KEY);
  }

  return { success: true, account: auth };
}

export function verifyAccountLogin(
  phone: string,
  pin: string
): { success: boolean; error?: string; account?: AccountAuth } {
  const cleanPhone = (phone || '').trim().replace(/\D/g, '');
  const cleanPin = (pin || '').trim();

  if (!isValidPhone(cleanPhone)) {
    return { success: false, error: 'invalid_phone' };
  }
  if (!isValidPin(cleanPin)) {
    return { success: false, error: 'invalid_pin' };
  }

  const account = getAccountAuth();

  if (!account || !account.isRegistered) {
    return {
      success: false,
      error: 'no_account',
    };
  }

  if (account.phone !== cleanPhone) {
    return {
      success: false,
      error: 'phone_mismatch',
    };
  }

  // Compare the legacy deterministic digest. This is local-only and not strong authentication.
  const calculatedHash = hashPin(cleanPin);
  if (account.pinHash !== calculatedHash) {
    return {
      success: false,
      error: 'pin_mismatch',
    };
  }

  // Login successful
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOGIN_STATUS_STORAGE_KEY, 'true');
    localStorage.removeItem(GUEST_STATUS_STORAGE_KEY);
  }

  return {
    success: true,
    account,
  };
}

// PIN reset must be verified by a trusted server/SMS provider.
// A client-generated OTP stored in sessionStorage is not identity verification:
// users can inspect or modify it with browser developer tools. Until a backend
// is configured, fail closed and do not allow a PIN reset from this flow.
export function requestPinResetOtp(phone: string): {
  success: boolean;
  error?: string;
  expiresInSeconds?: number;
} {
  const cleanPhone = (phone || '').trim().replace(/\D/g, '');
  if (!isValidPhone(cleanPhone)) {
    return { success: false, error: 'invalid_phone' };
  }

  const account = getAccountAuth();
  if (!account || account.phone !== cleanPhone) {
    return { success: false, error: 'no_account' };
  }

  return { success: false, error: 'otp_service_unavailable' };
}

export function verifyPinResetOtpAndSetNewPin(
  _phone: string,
  _enteredOtp: string,
  _newPin: string
): { success: boolean; error?: string } {
  // Deliberately fail closed. Never trust a code generated in the browser.
  return { success: false, error: 'otp_service_unavailable' };
}

export function isUserLoggedIn(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(LOGIN_STATUS_STORAGE_KEY) === 'true';
}

export function logoutUser(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOGIN_STATUS_STORAGE_KEY, 'false');
  localStorage.removeItem(GUEST_STATUS_STORAGE_KEY);
}

export type { FarmerProfile, SecuritySettings, AccountAuth };
