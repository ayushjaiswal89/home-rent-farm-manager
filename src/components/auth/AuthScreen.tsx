import React, { useState, useEffect } from 'react';
import {
  ChevronRight,
  ArrowRight,
  Leaf,
  Phone,
  User,
  MapPin,
  Lock,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  Shield,
  Smartphone,
  Eye,
  EyeOff,
  X,
  KeyRound,
  RotateCcw,
  Mail,
  Cloud,
} from 'lucide-react';
import type { Lang, FarmerProfile } from '../../lib/types';
import {
  saveFarmerProfile,
  getFarmerProfile,
  registerNewAccount,
  verifyAccountLogin,
  requestPinResetOtp,
  verifyPinResetOtpAndSetNewPin,
  startGuestSession,
  getAccountAuth,
  isValidPhone,
  isValidPin,
} from '../../lib/profileAndSecurity';
import {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from '../../lib/firebase';

interface AuthScreenProps {
  lang: Lang;
  onLoginSuccess: (farmerName?: string) => void;
  onCancel?: () => void;
  isModal?: boolean;
}

export function AuthScreen({
  lang,
  onLoginSuccess,
  onCancel,
  isModal = false,
}: AuthScreenProps) {
  const isHi = lang === 'hi';
  const [view, setView] = useState<'splash' | 'login' | 'signup' | 'forgot_pin'>('splash');

  // Login form states (no hardcoded demo pre-fill)
  const [authMode, setAuthMode] = useState<'phone' | 'cloud'>('phone');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);

  // Signup form states
  const [name, setName] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupPin, setSignupPin] = useState('');
  const [showSignupPin, setShowSignupPin] = useState(false);
  const [village, setVillage] = useState('');

  // 2-Step Identity Verification for PIN Reset
  const [forgotStep, setForgotStep] = useState<'request_otp' | 'verify_otp'>('request_otp');
  const [resetPhone, setResetPhone] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [generatedOtpDemoNotice, setGeneratedOtpDemoNotice] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // OTP resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (authMode === 'cloud') {
      const cleanEmail = email.trim();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        setError(isHi ? 'कृपया वैध ईमेल आईडी दर्ज करें' : 'Please enter a valid email address');
        return;
      }
      if (!password || password.length < 6) {
        setError(isHi ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए' : 'Password must be at least 6 characters');
        return;
      }

      setIsLoading(true);
      try {
        const userCred = await signInWithEmailAndPassword(auth, cleanEmail, password);
        const freshProfile = getFarmerProfile();
        if (!freshProfile.name && userCred.user.displayName) {
          freshProfile.name = userCred.user.displayName;
        }
        freshProfile.email = cleanEmail;
        saveFarmerProfile(freshProfile);
        if (typeof window !== 'undefined') {
          localStorage.setItem('sk-is-logged-in', 'true');
        }
        // Pull latest records from cloud to local IndexedDB
        onLoginSuccess(freshProfile.name || cleanEmail.split('@')[0]);
      } catch (err: any) {
        console.error('Firebase login error:', err);
        const code = err?.code || '';
        if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
          setError(isHi ? 'गलत ईमेल या पासवर्ड। कृपया पुनः जाँचें।' : 'Invalid email or password.');
        } else if (code === 'auth/network-request-failed') {
          setError(isHi ? 'इंटरनेट कनेक्शन उपलब्ध नहीं है।' : 'Network connection failed.');
        } else {
          setError(isHi ? `लॉगिन विफल रहा: ${err.message || 'त्रुटि'}` : 'Login failed.');
        }
      } finally {
        setIsLoading(false);
      }
      return;
    }

    const cleanPhone = phone.trim().replace(/\D/g, '');
    const cleanPin = pin.trim();

    if (!isValidPhone(cleanPhone)) {
      setError(
        isHi
          ? 'कृपया 10 अंकों का वैध भारतीय मोबाइल नंबर दर्ज करें (6, 7, 8 या 9 से शुरू)'
          : 'Please enter a valid 10-digit mobile number (starting with 6-9)'
      );
      return;
    }
    if (!isValidPin(cleanPin)) {
      setError(
        isHi ? 'सुरक्षा PIN ठीक 4 अंकों (संख्या) का होना चाहिए' : 'PIN must be exactly 4 digits'
      );
      return;
    }

    const res = verifyAccountLogin(cleanPhone, cleanPin);
    if (!res.success) {
      if (res.error === 'no_account') {
        setError(
          isHi
            ? 'यह मोबाइल नंबर पंजीकृत नहीं है। कृपया "अकाउंट बनाएं" पर टैप करें।'
            : 'No registered account found for this number. Please sign up first.'
        );
      } else if (res.error === 'phone_mismatch') {
        setError(
          isHi
            ? 'मोबाइल नंबर पंजीकृत खाते से मेल नहीं खाता।'
            : 'Phone number does not match registered account.'
        );
      } else if (res.error === 'pin_mismatch') {
        setError(
          isHi
            ? 'दर्ज किया गया PIN गलत है। कृपया सही 4 अंकों का PIN दर्ज करें।'
            : 'Incorrect PIN. Please try again or tap "Forgot PIN?".'
        );
      } else {
        setError(isHi ? 'लॉगिन विफल रहा।' : 'Login failed.');
      }
      return;
    }

    setError(null);
    onLoginSuccess(res.account?.name);
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (authMode === 'cloud') {
      const cleanName = name.trim();
      const cleanEmail = email.trim();
      if (!cleanName) {
        setError(isHi ? 'कृपया किसान का नाम दर्ज करें' : 'Please enter farmer name');
        return;
      }
      if (!cleanEmail || !cleanEmail.includes('@')) {
        setError(isHi ? 'कृपया वैध ईमेल आईडी दर्ज करें' : 'Please enter a valid email address');
        return;
      }
      if (!password || password.length < 6) {
        setError(isHi ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए' : 'Password must be at least 6 characters');
        return;
      }

      setIsLoading(true);
      try {
        await createUserWithEmailAndPassword(auth, cleanEmail, password);
        const freshProfile = getFarmerProfile();
        freshProfile.name = cleanName;
        freshProfile.email = cleanEmail;
        if (village.trim()) freshProfile.village = village.trim();
        saveFarmerProfile(freshProfile);
        if (typeof window !== 'undefined') {
          localStorage.setItem('sk-is-logged-in', 'true');
        }
        // Sync local IndexedDB records to cloud
        onLoginSuccess(cleanName);
      } catch (err: any) {
        console.error('Firebase signup error:', err);
        const code = err?.code || '';
        if (code === 'auth/email-already-in-use') {
          setError(isHi ? 'इस ईमेल पर पहले से अकाउंट बना है। कृपया लॉगिन करें।' : 'Email is already registered. Please log in.');
        } else if (code === 'auth/weak-password') {
          setError(isHi ? 'पासवर्ड कमजोर है। कम से कम 6 अक्षर दर्ज करें।' : 'Password is too weak.');
        } else {
          setError(isHi ? `साइन अप विफल: ${err.message || 'त्रुटि'}` : 'Signup failed.');
        }
      } finally {
        setIsLoading(false);
      }
      return;
    }

    const cleanName = name.trim();
    const cleanPhone = signupPhone.trim().replace(/\D/g, '');
    const cleanPin = signupPin.trim();

    if (!cleanName) {
      setError(isHi ? 'कृपया किसान का नाम दर्ज करें' : 'Please enter farmer name');
      return;
    }
    if (!isValidPhone(cleanPhone)) {
      setError(
        isHi
          ? 'कृपया 10 अंकों का वैध भारतीय मोबाइल नंबर दर्ज करें (6, 7, 8 या 9 से शुरू)'
          : 'Please enter a valid 10-digit mobile number (starting with 6-9)'
      );
      return;
    }
    if (!isValidPin(cleanPin)) {
      setError(
        isHi ? 'सुरक्षा PIN ठीक 4 अंकों (संख्या) का होना चाहिए' : 'PIN must be exactly 4 digits'
      );
      return;
    }

    setError(null);
    const regRes = registerNewAccount({
      name: cleanName,
      phone: cleanPhone,
      pin: cleanPin,
      village: village.trim(),
    });

    if (!regRes.success || !regRes.account) {
      if (regRes.error === 'account_exists') {
        setError(isHi
          ? 'इस डिवाइस पर पहले से एक अकाउंट मौजूद है। नया अकाउंट बनाने से पहले पुराने अकाउंट का डेटा बैकअप करें।'
          : 'An account already exists on this device. Back up its data before replacing or migrating accounts.');
      } else {
        setError(isHi ? 'अकाउंट बनाने में त्रुटि हुई। कृपया पुनः प्रयास करें।' : 'Failed to create account.');
      }
      return;
    }

    onLoginSuccess(regRes.account.name);
  };

  // Step 1: Request OTP for PIN Reset
  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = resetPhone.trim().replace(/\D/g, '');

    if (!isValidPhone(cleanPhone)) {
      setError(
        isHi
          ? 'कृपया 10 अंकों का वैध पंजीकृत मोबाइल नंबर दर्ज करें'
          : 'Please enter registered 10-digit mobile number'
      );
      return;
    }

    const res = requestPinResetOtp(cleanPhone);
    if (!res.success) {
      if (res.error === 'no_account') {
        setError(
          isHi
            ? 'यह मोबाइल नंबर पंजीकृत नहीं है। कृपया पहले नया अकाउंट बनाएं।'
            : 'No account registered with this mobile number. Please sign up.'
        );
      } else if (res.error === 'otp_service_unavailable') {
        setError(isHi
          ? 'सुरक्षित PIN रीसेट अभी उपलब्ध नहीं है। SMS OTP सेवा/बैकएंड जुड़ा नहीं है, इसलिए ऐप PIN रीसेट नहीं करेगा। लॉगिन होने पर Settings से PIN बदलें और अपने डेटा का बैकअप रखें।'
          : 'Secure PIN reset is unavailable because no trusted SMS OTP backend is configured. The app will not reset the PIN. If logged in, change it in Settings and keep a data backup.');
      } else {
        setError(isHi ? 'OTP भेजने में त्रुटि हुई।' : 'Error requesting OTP.');
      }
      return;
    }

    // A trusted backend is required before this flow can continue.
    setError(isHi ? 'सुरक्षित OTP सेवा उपलब्ध नहीं है।' : 'Secure OTP service is unavailable.');
  };

  // Step 2: Verify OTP and Set New PIN
  const handleVerifyOtpAndReset = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = resetPhone.trim().replace(/\D/g, '');
    const cleanOtp = enteredOtp.trim();
    const cleanPin = newPin.trim();
    const cleanConfirm = confirmNewPin.trim();

    if (!cleanOtp || cleanOtp.length !== 6) {
      setError(isHi ? 'कृपया 6 अंकों का सुरक्षा OTP दर्ज करें' : 'Please enter 6-digit OTP');
      return;
    }
    if (!isValidPin(cleanPin)) {
      setError(isHi ? 'नया PIN ठीक 4 अंकों का होना चाहिए' : 'New PIN must be exactly 4 digits');
      return;
    }
    if (cleanPin !== cleanConfirm) {
      setError(isHi ? 'नया PIN और पुष्टि PIN मेल नहीं खाते' : 'New PIN and confirm PIN do not match');
      return;
    }

    const res = verifyPinResetOtpAndSetNewPin(cleanPhone, cleanOtp, cleanPin);
    if (!res.success) {
      if (res.error === 'otp_incorrect') {
        setError(isHi ? 'दर्ज किया गया OTP गलत है। कृपया पुनः जांचें।' : 'Incorrect OTP. Please check and retry.');
      } else if (res.error === 'otp_expired') {
        setError(isHi ? 'यह OTP समाप्त हो गया है। कृपया "OTP पुनः भेजें" पर टैप करें।' : 'OTP expired. Please resend.');
      } else if (res.error === 'otp_service_unavailable') {
        setError(isHi ? 'सुरक्षित OTP सेवा उपलब्ध नहीं है; PIN नहीं बदला गया।' : 'Secure OTP service is unavailable; PIN was not changed.');
      } else {
        setError(isHi ? 'पहचान सत्यापन विफल रहा।' : 'Identity verification failed.');
      }
      return;
    }

    setError(null);
    setPhone(cleanPhone);
    setPin(cleanPin);
    setResetSuccessMsg(
      isHi
        ? 'पहचान सत्यापित! नया PIN सफलतापूर्वक सेट हो गया। कृपया लॉगिन करें।'
        : 'Identity verified! PIN reset successfully. Please log in.'
    );
    setForgotStep('request_otp');
    setGeneratedOtpDemoNotice(null);
    setView('login');
  };

  // Dedicated guest mode - does NOT create a fake registered account
  const handleGuestMode = () => {
    startGuestSession();
    const current = getFarmerProfile();
    onLoginSuccess(current.name || (isHi ? 'अतिथि किसान' : 'Guest Farmer'));
  };

  const content = (
    <div className="w-full max-w-sm mx-auto min-h-screen sm:min-h-[640px] flex flex-col justify-between bg-[#f6faf6] text-slate-900 sm:rounded-3xl shadow-2xl border border-emerald-200/80 overflow-hidden relative font-sans">
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-3.5 right-3.5 z-30 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-slate-600 flex items-center justify-center shadow-xs transition-colors cursor-pointer"
          title="बंद करें"
        >
          <X size={18} />
        </button>
      )}

      {/* 1. SCREEN 1: SPLASH SCREEN (स्प्लैश स्क्रीन) */}
      {view === 'splash' && (
        <div className="flex-1 flex flex-col justify-between p-6 sm:p-7 relative z-10 text-center">
          {/* Top Logo and Tagline */}
          <div className="flex flex-col items-center pt-4">
            {/* Green Leaf Emblem */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 via-green-600 to-emerald-800 flex items-center justify-center text-white shadow-lg shadow-emerald-800/25 mb-3.5">
              <Leaf size={36} className="fill-white" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Smart Khata
            </h1>
            <p className="text-xs font-semibold text-emerald-800 mt-1">
              {isHi ? 'डिजिटल लेज़र & उधार बही खाता' : 'Digital Ledger & Khata'}
            </p>
          </div>

          {/* Center Main Tagline matching Screen 1 */}
          <div className="py-6 my-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-emerald-800 leading-tight">
              {isHi ? 'सही हिसाब' : 'Accurate Accounting'}
            </h2>
            <h2 className="text-2xl sm:text-3xl font-black text-emerald-900 leading-tight mt-1">
              {isHi ? 'सही फैसला' : 'Better Decisions'}
            </h2>
          </div>

          {/* Scenic Lush Farm Fields Illustration matching Screen 1 */}
          <div className="relative w-full h-44 rounded-2xl overflow-hidden my-3 border border-emerald-200/70 shadow-inner bg-gradient-to-b from-sky-100 via-emerald-100 to-emerald-600 flex items-end">
            <svg viewBox="0 0 400 140" className="w-full h-full object-cover">
              {/* Sky sun */}
              <circle cx="280" cy="35" r="22" fill="#fef08a" opacity="0.85" />
              {/* Back hills */}
              <path d="M 0 65 Q 120 40 240 60 T 400 50 L 400 140 L 0 140 Z" fill="#65a30d" opacity="0.7" />
              {/* Mid green farm rows */}
              <path d="M 0 80 Q 150 65 300 85 T 400 75 L 400 140 L 0 140 Z" fill="#16a34a" opacity="0.9" />
              {/* Front farm rows */}
              <path d="M 0 100 Q 100 90 200 105 T 400 95 L 400 140 L 0 140 Z" fill="#15803d" />
              {/* Field perspective lines */}
              <line x1="200" y1="95" x2="50" y2="140" stroke="#0f6a31" strokeWidth="2.5" />
              <line x1="200" y1="95" x2="150" y2="140" stroke="#0f6a31" strokeWidth="2.5" />
              <line x1="200" y1="95" x2="250" y2="140" stroke="#0f6a31" strokeWidth="2.5" />
              <line x1="200" y1="95" x2="350" y2="140" stroke="#0f6a31" strokeWidth="2.5" />
            </svg>
          </div>

          {/* Big Green Action Button: "शुरू करें" matching Screen 1 */}
          <div className="w-full space-y-3 pt-2">
            <button
              type="button"
              onClick={() => setView('login')}
              className="w-full py-3.5 px-5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-black text-base shadow-md active:scale-95 transition cursor-pointer"
            >
              {isHi ? 'शुरू करें' : 'Get Started'}
            </button>

            <p className="text-[11px] text-slate-500 font-medium">
              {isHi ? 'किसानों के लिए, किसानों द्वारा' : 'For farmers, by farmers'}
            </p>
          </div>
        </div>
      )}

      {/* 2. SCREEN 2: LOGIN SCREEN (लॉगिन स्क्रीन) */}
      {view === 'login' && (
        <div className="flex-1 flex flex-col justify-between p-6 sm:p-7 relative z-10">
          <div>
            {/* Logo + Title matching Screen 2 */}
            <div className="flex flex-col items-center text-center pt-2 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 via-green-600 to-emerald-800 flex items-center justify-center text-white shadow-md shadow-emerald-800/25 mb-2">
                <Leaf size={30} className="fill-white" />
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Smart Khata
              </h2>
              <h3 className="text-lg font-black text-slate-800 mt-2">
                {isHi ? 'स्वागत है!' : 'Welcome!'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isHi ? 'अपने अकाउंट में लॉगिन करें' : 'Log in to your account'}
              </p>
            </div>

            {resetSuccessMsg && (
              <div className="p-3 mb-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
                <span>{resetSuccessMsg}</span>
              </div>
            )}

            {error && (
              <div className="p-3 mb-3 rounded-xl bg-red-100 border border-red-300 text-red-700 text-xs font-semibold">
                {error}
              </div>
            )}

            {/* Mode Switcher: Phone+PIN vs Cloud Sync */}
            <div className="flex rounded-xl bg-slate-100 p-1 mb-4 border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('phone');
                  setError(null);
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  authMode === 'phone'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Phone size={14} />
                <span>{isHi ? 'फ़ोन व PIN' : 'Phone & PIN'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('cloud');
                  setError(null);
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  authMode === 'cloud'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Cloud size={14} />
                <span>{isHi ? 'क्लाउड सिंक' : 'Cloud Sync'}</span>
              </button>
            </div>

            {/* Form matching Screen 2 */}
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              {authMode === 'cloud' ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isHi ? 'ईमेल आईडी' : 'Email Address'}
                    </label>
                    <div className="relative">
                      <Mail size={18} className="absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError(null);
                        }}
                        placeholder={isHi ? 'kisan@example.com' : 'kisan@example.com'}
                        className="w-full pl-11 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:border-emerald-600 bg-white shadow-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isHi ? 'पासवर्ड (कम से कम 6 अक्षर)' : 'Password (min 6 characters)'}
                    </label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setError(null);
                        }}
                        placeholder="••••••••"
                        className="w-full pl-11 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:border-emerald-600 bg-white shadow-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* मोबाइल नंबर */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isHi ? 'मोबाइल नंबर (10 अंक)' : 'Mobile Number (10 digits)'}
                    </label>
                    <div className="relative">
                      <Phone size={18} className="absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type="tel"
                        maxLength={10}
                        required
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value.replace(/\D/g, ''));
                          setError(null);
                        }}
                        placeholder={isHi ? '10 अंकों का मोबाइल नंबर' : '10-digit mobile number'}
                        className="w-full pl-11 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold focus:outline-none focus:border-emerald-600 bg-white shadow-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* 4 अंकों का PIN */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isHi ? '4 अंकों का सुरक्षा PIN' : '4-digit Security PIN'}
                    </label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type={showPin ? 'text' : 'password'}
                        maxLength={4}
                        required
                        value={pin}
                        onChange={(e) => {
                          setPin(e.target.value.replace(/\D/g, ''));
                          setError(null);
                        }}
                        placeholder="••••"
                        className="w-full pl-11 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold focus:outline-none focus:border-emerald-600 bg-white shadow-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin(!showPin)}
                        className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* लॉगिन बटन matching Screen 2 */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm shadow-md active:scale-95 transition cursor-pointer mt-2 disabled:opacity-50"
              >
                {isLoading ? (isHi ? 'सत्यापित हो रहा है...' : 'Verifying...') : (isHi ? 'लॉगिन' : 'Login')}
              </button>

              {/* Links below: PIN भूल गए? | अकाउंट बनाएं */}
              <div className="flex items-center justify-between text-xs pt-1 font-semibold text-emerald-800">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setResetSuccessMsg(null);
                    setResetPhone(phone);
                    setView('forgot_pin');
                  }}
                  className="hover:underline cursor-pointer"
                >
                  {isHi ? 'PIN भूल गए?' : 'Forgot PIN?'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setResetSuccessMsg(null);
                    setView('signup');
                  }}
                  className="hover:underline cursor-pointer"
                >
                  {isHi ? 'नया अकाउंट बनाएं' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>

          {/* Lush Green Field Graphic at bottom matching Screen 2 */}
          <div className="w-full h-24 rounded-2xl overflow-hidden mt-6 border border-emerald-200/50 shadow-inner bg-gradient-to-t from-emerald-600 via-emerald-400 to-sky-100 flex items-end">
            <svg viewBox="0 0 400 80" className="w-full h-full object-cover">
              <path d="M 0 35 Q 120 20 240 30 T 400 25 L 400 80 L 0 80 Z" fill="#16a34a" />
              <path d="M 0 45 Q 150 40 300 50 T 400 45 L 400 80 L 0 80 Z" fill="#15803d" />
            </svg>
          </div>
        </div>
      )}

      {/* 3. SIGNUP VIEW */}
      {view === 'signup' && (
        <div className="flex-1 flex flex-col justify-between p-6 sm:p-7 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setView('login');
                }}
                className="p-1 rounded-full text-slate-600 hover:bg-emerald-100 transition cursor-pointer"
              >
                <ArrowLeft size={18} />
              </button>
              <h2 className="text-lg font-black text-slate-900">
                {isHi ? 'नया अकाउंट बनाएं' : 'Create Account'}
              </h2>
            </div>

            {error && (
              <div className="p-3 mb-3 rounded-xl bg-red-100 border border-red-300 text-red-700 text-xs font-semibold">
                {error}
              </div>
            )}

            {/* Mode Switcher: Phone+PIN vs Cloud Sync */}
            <div className="flex rounded-xl bg-slate-100 p-1 mb-4 border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('phone');
                  setError(null);
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  authMode === 'phone'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Phone size={14} />
                <span>{isHi ? 'फ़ोन व PIN' : 'Phone & PIN'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('cloud');
                  setError(null);
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  authMode === 'cloud'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Cloud size={14} />
                <span>{isHi ? 'क्लाउड सिंक' : 'Cloud Sync'}</span>
              </button>
            </div>

            <form onSubmit={handleSignUpSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isHi ? 'किसान का नाम *' : 'Farmer Name *'}
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setError(null);
                    }}
                    placeholder={isHi ? 'जैसे: रामलाल यादव' : 'e.g. Ramlal Yadav'}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:border-emerald-600 bg-white shadow-xs"
                  />
                </div>
              </div>

              {authMode === 'cloud' ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isHi ? 'ईमेल आईडी *' : 'Email Address *'}
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError(null);
                        }}
                        placeholder="kisan@example.com"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:border-emerald-600 bg-white shadow-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isHi ? 'पासवर्ड (कम से कम 6 अक्षर) *' : 'Password (min 6 characters) *'}
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setError(null);
                        }}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:border-emerald-600 bg-white shadow-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isHi ? 'मोबाइल नंबर (10 अंक) *' : 'Mobile Number (10 digits) *'}
                    </label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type="tel"
                        maxLength={10}
                        required
                        value={signupPhone}
                        onChange={(e) => {
                          setSignupPhone(e.target.value.replace(/\D/g, ''));
                          setError(null);
                        }}
                        placeholder={isHi ? '10 अंकों का मोबाइल नंबर' : '10-digit mobile number'}
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:border-emerald-600 bg-white shadow-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isHi ? '4 अंकों का सुरक्षा PIN बनाएं *' : 'Create 4-digit Security PIN *'}
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type={showSignupPin ? 'text' : 'password'}
                        maxLength={4}
                        required
                        value={signupPin}
                        onChange={(e) => {
                          setSignupPin(e.target.value.replace(/\D/g, ''));
                          setError(null);
                        }}
                        placeholder="जैसे: 1234"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:border-emerald-600 bg-white shadow-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPin(!showSignupPin)}
                        className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showSignupPin ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isHi ? 'गाँव / क्षेत्र (वैकल्पिक)' : 'Village / Area (Optional)'}
                </label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    placeholder={isHi ? 'गाँव या शहर का नाम' : 'Village or city name'}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:border-emerald-600 bg-white shadow-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm shadow-md active:scale-95 transition cursor-pointer mt-4 disabled:opacity-50"
              >
                {isLoading ? (isHi ? 'अकाउंट बन रहा है...' : 'Creating...') : (isHi ? 'अकाउंट बनाएं व शुरू करें' : 'Register & Start')}
              </button>
            </form>
          </div>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={handleGuestMode}
              className="text-xs font-bold text-slate-500 hover:text-emerald-800 underline cursor-pointer"
            >
              {isHi ? 'गेस्ट मोड में जारी रखें' : 'Continue as Guest'}
            </button>
          </div>
        </div>
      )}

      {/* 4. FORGOT PIN VIEW */}
      {view === 'forgot_pin' && (
        <div className="flex-1 flex flex-col justify-between p-6 sm:p-7 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  if (forgotStep === 'verify_otp') {
                    setForgotStep('request_otp');
                  } else {
                    setView('login');
                  }
                }}
                className="p-1 rounded-full text-slate-600 hover:bg-emerald-100 transition cursor-pointer"
              >
                <ArrowLeft size={18} />
              </button>
              <h2 className="text-lg font-black text-slate-900">
                {isHi ? 'PIN रीसेट (सत्यापन)' : 'Reset PIN (Verification)'}
              </h2>
            </div>

            {error && (
              <div className="p-3 mb-3 rounded-xl bg-red-100 border border-red-300 text-red-700 text-xs font-semibold">
                {error}
              </div>
            )}

            {forgotStep === 'request_otp' && (
              <>
                <div className="text-xs text-amber-900 bg-amber-50 border border-amber-300 rounded-xl p-3 mb-4" role="status">
                  {isHi
                    ? 'सुरक्षा सूचना: SMS OTP सेवा अभी जुड़ी नहीं है। इस स्क्रीन से PIN रीसेट नहीं किया जा सकता। स्क्रीन पर दिखने वाला कोई भी कोड असली पहचान सत्यापन नहीं होता।'
                    : 'Security notice: SMS OTP service is not connected. PIN reset is unavailable here. A code displayed by the app is not real identity verification.'}
                </div>

                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isHi ? 'पंजीकृत मोबाइल नंबर (10 अंक) *' : 'Registered Mobile Number (10 digits) *'}
                    </label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type="tel"
                        maxLength={10}
                        required
                        value={resetPhone}
                        onChange={(e) => {
                          setResetPhone(e.target.value.replace(/\D/g, ''));
                          setError(null);
                        }}
                        placeholder={isHi ? '10 अंकों का मोबाइल नंबर' : '10-digit mobile number'}
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold bg-white shadow-xs font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm shadow-md cursor-pointer transition active:scale-95 flex items-center justify-center gap-2"
                  >
                    <span>{isHi ? 'सुरक्षा OTP प्राप्त करें' : 'Get Security OTP'}</span>
                    <ArrowRight size={16} />
                  </button>
                </form>
              </>
            )}

            {forgotStep === 'verify_otp' && (
              <>
                {/* Simulated SMS card for realistic verification simulation */}
                {generatedOtpDemoNotice && (
                  <div className="mb-4 p-3.5 rounded-2xl bg-amber-50/90 border border-amber-300 text-amber-900 shadow-xs">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-800 mb-1">
                      <Smartphone size={14} className="text-amber-700" />
                      <span>{isHi ? 'सिम्युलेटेड SMS संदेश' : 'Simulated SMS Message'}</span>
                    </div>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      {isHi
                        ? `मोबाइल ${resetPhone} हेतु आपका 6-अंकों का सुरक्षा OTP:`
                        : `Security OTP for mobile ${resetPhone}:`}
                    </p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-amber-200">
                      <span className="text-base font-black tracking-widest font-mono text-emerald-800">
                        {generatedOtpDemoNotice}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEnteredOtp(generatedOtpDemoNotice);
                          setError(null);
                        }}
                        className="text-xs font-bold bg-amber-200 hover:bg-amber-300 text-amber-900 px-2.5 py-1 rounded-lg cursor-pointer transition"
                      >
                        {isHi ? 'OTP स्वतः भरें' : 'Auto Fill'}
                      </button>
                    </div>
                  </div>
                )}

                <p className="text-xs text-slate-600 mb-3">
                  {isHi
                    ? 'प्राप्त 6 अंकों का OTP दर्ज करें और अपना नया 4 अंकों का सुरक्षा PIN बनाएं।'
                    : 'Enter the 6-digit OTP and set your new 4-digit security PIN.'}
                </p>

                <form onSubmit={handleVerifyOtpAndReset} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isHi ? '6 अंकों का सुरक्षा OTP *' : '6-digit Security OTP *'}
                    </label>
                    <div className="relative">
                      <KeyRound size={16} className="absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={enteredOtp}
                        onChange={(e) => {
                          setEnteredOtp(e.target.value.replace(/\D/g, ''));
                          setError(null);
                        }}
                        placeholder="000000"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-base font-black tracking-widest bg-white shadow-xs font-mono text-emerald-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isHi ? 'नया 4 अंकों का सुरक्षा PIN *' : 'New 4-digit PIN *'}
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type="password"
                        maxLength={4}
                        required
                        value={newPin}
                        onChange={(e) => {
                          setNewPin(e.target.value.replace(/\D/g, ''));
                          setError(null);
                        }}
                        placeholder="जैसे: 5678"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold bg-white shadow-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isHi ? 'नये PIN की पुष्टि करें *' : 'Confirm New PIN *'}
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-3 text-slate-400" />
                      <input
                        type="password"
                        maxLength={4}
                        required
                        value={confirmNewPin}
                        onChange={(e) => {
                          setConfirmNewPin(e.target.value.replace(/\D/g, ''));
                          setError(null);
                        }}
                        placeholder="वही 4 अंक पुनः दर्ज करें"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold bg-white shadow-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      disabled={resendCooldown > 0}
                      onClick={handleRequestOtp}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 disabled:text-slate-400 flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <RotateCcw size={13} />
                      {resendCooldown > 0
                        ? `${isHi ? 'OTP पुनः भेजें' : 'Resend OTP'} (${resendCooldown}s)`
                        : isHi
                        ? 'OTP पुनः भेजें'
                        : 'Resend OTP'}
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm shadow-md cursor-pointer transition active:scale-95"
                  >
                    {isHi ? 'सत्यापित करें व नया PIN सेट करें' : 'Verify & Set New PIN'}
                  </button>
                </form>
              </>
            )}
          </div>

          <div className="text-center pt-3 border-t border-slate-200 mt-4">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setView('login');
              }}
              className="text-xs font-bold text-slate-600 hover:text-emerald-800 cursor-pointer"
            >
              {isHi ? 'लॉगिन स्क्रीन पर वापस जाएँ' : 'Back to Login'}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
        {content}
      </div>
    );
  }

  return content;
}
