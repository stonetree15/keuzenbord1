import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { LogIn, Mail, Lock, UserPlus, ShieldCheck, Eye, Scale, FileText, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const Login: React.FC = () => {
  const { user, signInWithGoogle, signInWithEmail, signUpWithEmail, sendPasswordResetEmail, sendVerificationEmail, logout, refreshUser } = useAuth();
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [isSignUp, setIsSignUp] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isResetMode, setIsResetMode] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [privacyAccepted, setPrivacyAccepted] = React.useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = React.useState(false);
  const [legalModalTab, setLegalModalTab] = React.useState<'privacy' | 'terms' | 'contact'>('privacy');
  const [cookieStateTrigger, setCookieStateTrigger] = React.useState(0);

  React.useEffect(() => {
    const handleConsentChanged = () => {
      setCookieStateTrigger(prev => prev + 1);
    };
    window.addEventListener('cookie-consent-changed', handleConsentChanged);
    return () => window.removeEventListener('cookie-consent-changed', handleConsentChanged);
  }, []);

  const isUnverified = user && !user.emailVerified && user.providerData.some(p => p.providerId === 'password');

  const handleSocialLogin = async () => {
    if (!privacyAccepted) {
      setError('Gelieve eerst akkoord te gaan met de algemene voorwaarden en het privacybeleid door het vinkje aan te vinken.');
      return;
    }
    setError(null);
    setSuccess(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Het inlogvenster is gesloten voordat je klaar was. Probeer het gerust nog een keer.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Inloggen met Google staat momenteel nog uit. Neem contact op met de beheerder.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Er is een probleem met de internetverbinding. Controleer of je online bent.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Er is even te vaak geprobeerd in te loggen. Wacht een paar minuutjes en probeer het dan opnieuw.');
      } else if (err.code === 'auth/invalid-credential') {
        setError('Je inloggegevens zijn niet meer geldig. Log even opnieuw in.');
      } else {
        setError(`Er is een foutje opgetreden bij het inloggen: ${err.message || err.code || 'Onbekende fout'}`);
      }
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || (!isResetMode && !password)) {
      setError('Vergeet niet om alle velden in te vullen.');
      return;
    }

    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      if (isResetMode) {
        await sendPasswordResetEmail(email);
        setSuccess('We hebben je een e-mail gestuurd om je wachtwoord te herstellen. Kijk ook even in je ongewenste post.');
        setIsResetMode(false);
      } else if (isSignUp) {
        await signUpWithEmail(email, password);
        const consentData = {
          timestamp: new Date().toISOString(),
          version: '2026-05-26',
          email: email
        };
        localStorage.setItem('keuzebord_legal_consent_20260526', JSON.stringify(consentData));
        console.log('Gebruiker ging akkoord met algemene voorwaarden en privacybeleid:', consentData);
        setSuccess('Hoera! Je account is aangemaakt. Vergeet niet je e-mail te bevestigen via de link die we je gestuurd hebben.');
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('De combinatie van e-mailadres en wachtwoord klopt niet. Probeer het nog een keer.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Dit e-mailadres is al bekend bij ons. Heb je misschien al een account?');
      } else if (err.code === 'auth/weak-password') {
        setError('Kies een sterker wachtwoord met minstens 6 tekens.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Dit lijkt geen geldig e-mailadres te zijn. Controleer het even.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('Inloggen met e-mail staat momenteel nog uit. Neem contact op met de beheerder.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Oeps, er zijn te veel mislukte pogingen gedaan. Je account is tijdelijk geblokkeerd. Wacht even of herstel je wachtwoord.');
      } else {
        setError(`Er is een foutje opgetreden: ${err.message || err.code || 'Onbekende fout'}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);
    try {
      await sendVerificationEmail();
      setSuccess('Klaar! De bevestigingsmail is opnieuw naar je verzonden.');
    } catch (err: any) {
      setError('Het lukt even niet om de e-mail te verzenden. Probeer het later nog eens.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isUnverified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="shadow-xl border-2 overflow-hidden">
            <CardHeader className="text-center space-y-2">
              <div className="mx-auto bg-amber-100 p-3 rounded-2xl w-fit">
                <Mail className="w-8 h-8 text-amber-600" />
              </div>
              <CardTitle className="text-2xl font-black text-gray-900">Verifieer je e-mail</CardTitle>
              <CardDescription className="text-gray-500 font-medium">
                We hebben een verificatie e-mail gestuurd naar <strong>{user?.email}</strong>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-amber-50 border-2 border-amber-100 rounded-xl text-amber-800 text-sm font-medium">
                Klik op de link in de e-mail om je account te gebruiken. Geen mail gekregen? Kijk dan even in je ongewenste post (spam).
              </div>

              {error && (
                <div className="p-3 bg-red-50 border-2 border-red-100 rounded-xl text-red-600 text-xs font-bold text-center">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 bg-green-50 border-2 border-green-100 rounded-xl text-green-600 text-xs font-bold text-center">
                  {success}
                </div>
              )}

              <Button 
                onClick={handleResendVerification}
                disabled={isSubmitting}
                className="w-full py-6 text-sm font-black uppercase tracking-widest bg-amber-600 hover:bg-amber-700 text-white shadow-md transition-all"
              >
                {isSubmitting ? 'Bezig...' : 'E-mail opnieuw verzenden'}
              </Button>

              <button 
                onClick={refreshUser}
                className="w-full text-xs font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-600"
              >
                Ik heb op de link geklikt (Controleer nu)
              </button>

              <button 
                onClick={logout}
                className="w-full text-xs font-black text-gray-400 uppercase tracking-widest hover:text-gray-600"
              >
                Log uit
              </button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl border-2 overflow-hidden">
          <CardHeader className="text-center space-y-2 pb-2">
            <div className="mx-auto bg-indigo-100 p-3 rounded-2xl w-fit">
              {isSignUp ? <UserPlus className="w-8 h-8 text-indigo-600" /> : <LogIn className="w-8 h-8 text-indigo-600" />}
            </div>
            <CardTitle className="text-2xl font-black text-gray-900">
              {isResetMode ? 'Wachtwoord vergeten' : isSignUp ? 'Account aanmaken' : 'Welkom terug'}
            </CardTitle>
            <CardDescription className="text-gray-500 font-medium">
              {isResetMode 
                ? 'Vul je e-mailadres in om je wachtwoord te herstellen.' 
                : isSignUp 
                  ? 'Maak een account om je keuzebord te bewaren.' 
                  : 'Log in om je eigen keuzebord te beheren.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AnimatePresence mode="wait">
              {(error || success) && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className={`p-3 border-2 rounded-xl text-xs font-bold text-center ${
                    error ? 'bg-red-50 border-red-100 text-red-600' : 'bg-green-50 border-green-100 text-green-600'
                  }`}
                >
                  {error || success}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleEmailAuth} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">E-mailadres</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="naam@voorbeeld.nl"
                    required
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-indigo-500 outline-none transition-all text-sm font-bold"
                  />
                </div>
              </div>

              {!isResetMode && (
                <div className="space-y-1">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Wachtwoord</label>
                    <button 
                      type="button"
                      onClick={() => setIsResetMode(true)}
                      className="text-[10px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-600"
                    >
                      Vergeten?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required={!isResetMode}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-indigo-500 outline-none transition-all text-sm font-bold"
                    />
                  </div>
                </div>
              )}

              {!isResetMode && (
                <div className="flex items-start gap-2.5 p-3 bg-indigo-50/50 border-2 border-indigo-100/50 rounded-xl animate-in fade-in slide-in-from-top-2 duration-200">
                  <input 
                    type="checkbox"
                    id="privacy-accepted"
                    checked={privacyAccepted}
                    onChange={(e) => setPrivacyAccepted(e.target.checked)}
                    required
                    className="mt-1 h-4.5 w-4.5 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300 cursor-pointer accent-indigo-600"
                  />
                  <label htmlFor="privacy-accepted" className="text-[10px] text-gray-650 font-bold leading-relaxed cursor-pointer select-none">
                    Ik ga akkoord met de <button type="button" onClick={() => { setLegalModalTab('terms'); setShowPrivacyModal(true); }} className="text-indigo-600 hover:underline font-black">algemene voorwaarden</button> en het <button type="button" onClick={() => { setLegalModalTab('privacy'); setShowPrivacyModal(true); }} className="text-indigo-600 hover:underline font-black">privacybeleid</button>. Ik bevestig dat ik of de school beschikt over een geldige rechtsgrond onder de AVG voor de verwerking van leerlingengegevens.
                  </label>
                </div>
              )}

              <Button 
                type="submit"
                disabled={isSubmitting || (!isResetMode && !privacyAccepted)}
                className={`w-full py-6 text-lg font-black uppercase tracking-widest shadow-md transition-all active:scale-95 ${
                  !isResetMode && !privacyAccepted 
                    ? 'bg-gray-300 hover:bg-gray-300 text-gray-500 cursor-not-allowed opacity-75' 
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                {isSubmitting ? 'Bezig...' : isResetMode ? 'Herstel verzenden' : isSignUp ? 'Registreren' : 'Inloggen'}
              </Button>
              
              {isResetMode && (
                <button 
                  type="button"
                  onClick={() => setIsResetMode(false)}
                  className="w-full text-xs font-black text-gray-400 uppercase tracking-widest hover:text-gray-600"
                >
                  Terug naar inloggen
                </button>
              )}
            </form>

            {!isResetMode && (
              <>
                <div className="relative py-2 flex items-center">
                  <div className="flex-grow border-t border-gray-200"></div>
                  <span className="flex-shrink mx-4 text-gray-400 text-[10px] font-black uppercase tracking-widest">Of via</span>
                  <div className="flex-grow border-t border-gray-200"></div>
                </div>

                <div className="grid grid-cols-1">
                  <Button 
                    onClick={() => handleSocialLogin()}
                    variant="outline" 
                    className="w-full py-6 text-xs font-black uppercase tracking-widest border-2 hover:bg-gray-50 flex items-center justify-center gap-3"
                  >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                    Inloggen met Google
                  </Button>
                </div>

                <p className="text-center text-xs font-medium text-gray-500">
                  {isSignUp ? 'Heb je al een account?' : 'Nog geen account?'} {' '}
                  <button 
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-indigo-600 font-black uppercase tracking-widest hover:underline"
                  >
                    {isSignUp ? 'Inloggen' : 'Registreren'}
                  </button>
                </p>
              </>
            )}

            <div className="pt-2 border-t border-gray-100 space-y-1.5">
              <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                Je gegevens worden veilig opgeslagen in je eigen account.
              </p>
              <div className="flex justify-center gap-4 py-1 flex-wrap">
                <button 
                  type="button" 
                  onClick={() => { setLegalModalTab('privacy'); setShowPrivacyModal(true); }} 
                  className="text-[9px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-600 hover:underline cursor-pointer"
                >
                  Privacyverklaring & Cookies
                </button>
                <span className="text-gray-300 text-[9px] font-black">•</span>
                <button 
                  type="button" 
                  onClick={() => { window.dispatchEvent(new CustomEvent('open-cookie-settings')); }} 
                  className="text-[9px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-600 hover:underline cursor-pointer"
                >
                  Cookie-instellingen
                </button>
                <span className="text-gray-300 text-[9px] font-black">•</span>
                <button 
                  type="button" 
                  onClick={() => { setLegalModalTab('terms'); setShowPrivacyModal(true); }} 
                  className="text-[9px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-600 hover:underline cursor-pointer"
                >
                  Algemene Gebruikersvoorwaarden
                </button>
                <span className="text-gray-300 text-[9px] font-black">•</span>
                <button 
                  type="button" 
                  onClick={() => { setLegalModalTab('contact'); setShowPrivacyModal(true); }} 
                  className="text-[9px] font-black text-indigo-500 uppercase tracking-widest hover:text-indigo-600 hover:underline cursor-pointer"
                >
                  Contact & Over ons
                </button>
              </div>

            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Privacyverklaring & Algemene Voorwaarden Modal Overlay */}
      <AnimatePresence>
        {showPrivacyModal && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2rem] border-2 border-gray-100 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden text-left"
            >
              <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-100 rounded-2xl text-indigo-600">
                    {legalModalTab === 'privacy' ? (
                      <ShieldCheck size={22} strokeWidth={2.5} />
                    ) : legalModalTab === 'contact' ? (
                      <Mail size={22} strokeWidth={2.5} />
                    ) : (
                      <Scale size={22} strokeWidth={2.5} />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-950 uppercase tracking-tight font-sans">
                      {legalModalTab === 'privacy' 
                        ? 'Privacyverklaring & Cookies' 
                        : legalModalTab === 'contact' 
                        ? 'Contact & Over ons' 
                        : 'Algemene Gebruikersvoorwaarden & EULA'}
                    </h3>
                    <p className="text-[8px] font-bold text-indigo-500 uppercase tracking-widest leading-none mt-1">
                      {legalModalTab === 'privacy' 
                        ? 'In overeenstemming met de AVG / GDPR & Belgische Privacywetgeving' 
                        : legalModalTab === 'contact'
                        ? 'Hobby project informatie en contactmogelijkheden'
                        : 'Algemene Gebruikersvoorwaarden en aansprakelijkheidsbeperking'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowPrivacyModal(false)}
                  className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-xl transition-all font-black text-xs cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-gray-100 bg-gray-50/35 px-6 gap-1.5 pt-2 shrink-0">
                <button
                  onClick={() => setLegalModalTab('privacy')}
                  className={`px-4 py-3 font-black text-[10px] uppercase tracking-wider rounded-t-xl transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                    legalModalTab === 'privacy'
                      ? 'border-indigo-600 text-indigo-650 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.02)]'
                      : 'border-transparent text-gray-400 hover:text-gray-650 bg-transparent'
                  }`}
                >
                  <ShieldCheck size={13} />
                  Privacybeleid (AVG / GDPR)
                </button>
                <button
                  onClick={() => setLegalModalTab('terms')}
                  className={`px-4 py-3 font-black text-[10px] uppercase tracking-wider rounded-t-xl transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                    legalModalTab === 'terms'
                      ? 'border-indigo-600 text-indigo-650 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.02)]'
                      : 'border-transparent text-gray-400 hover:text-gray-650 bg-transparent'
                  }`}
                >
                  <Scale size={13} />
                  Gebruikersvoorwaarden & Disclaimer
                </button>
                <button
                  onClick={() => setLegalModalTab('contact')}
                  className={`px-4 py-3 font-black text-[10px] uppercase tracking-wider rounded-t-xl transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                    legalModalTab === 'contact'
                      ? 'border-indigo-600 text-indigo-650 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.02)]'
                      : 'border-transparent text-gray-400 hover:text-gray-650 bg-transparent'
                  }`}
                >
                  <Mail size={13} />
                  Contact & Over Ons
                </button>
              </div>

              <div className="p-6 space-y-5 overflow-y-auto text-xs text-gray-600 leading-relaxed font-bold custom-scrollbar flex-1">
                {legalModalTab === 'privacy' && (
                  <div className="space-y-5 animate-in fade-in duration-150">
                    <div className="bg-indigo-50/50 text-indigo-900 p-4 rounded-2xl space-y-2 border border-indigo-100">
                      <p className="font-black text-[11.5px] uppercase tracking-wide flex items-center gap-1.5">
                        <ShieldCheck size={16} className="text-indigo-600 shrink-0" />
                        Privacybeleid Keuzebord
                      </p>
                      <p className="text-[10.5px] font-semibold text-indigo-700 leading-relaxed">
                        <strong>Laatste update:</strong> 26 mei 2026. Dit Privacybeleid beschrijft hoe Keuzebord omgaat met persoonsgegevens en cookies, met aandacht voor de toepasselijke Belgische en Europese privacywetgeving, inclusief de AVG/GDPR.
                      </p>
                    </div>

                    {/* 1. Inleiding en toepassingsgebied */}
                    <div className="space-y-1.5">
                      <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-tight flex items-center gap-1.5">
                        <span className="inline-block w-4 h-4 bg-indigo-100 text-indigo-600 rounded flex items-center justify-center text-[10px] font-extrabold mr-1">✓</span>
                        1. Inleiding en toepassingsgebied
                      </h4>
                      <p className="text-[10.5px] text-gray-500 font-medium">
                        Keuzebord is een online keuzebordapplicatie ontwikkeld voor gebruik in het onderwijs. Dit Privacybeleid is van toepassing op het gebruik van de website (de “Website”) en de applicatie, software en het platform (het “Platform”) dat wordt aangeboden en beheerd door Keuzebord.
                      </p>
                    </div>

                    {/* Gegevensbescherming & contact */}
                    <div className="space-y-1.5">
                      <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-tight flex items-center gap-1.5">
                        <CheckSquareIcon /> 2. Gegevensbescherming en contact
                      </h4>
                      <p className="text-[10.5px] text-gray-550 font-medium select-none font-semibold">
                        Voor vragen over dit Privacybeleid of voor de uitoefening van uw rechten onder de AVG kunt u contact opnemen met de ontwikkelaar/beheerder via de beschikbare contactmogelijkheden binnen het Platform.
                      </p>
                    </div>

                    {/* 3. Gegevensverwerking en doeleinden */}
                    <div className="space-y-3">
                      <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-tight flex items-center gap-1.5 text-indigo-650 animate-in fade-in duration-150">
                        <span className="inline-block w-4 h-4 bg-indigo-100 text-indigo-600 rounded flex items-center justify-center text-[10px] font-extrabold mr-1">✓</span>
                        3. Gegevensverwerking en doeleinden
                      </h4>
                      <p className="text-[10.5px] text-gray-550 font-medium font-semibold">
                        Wij verwerken uitsluitend persoonsgegevens die noodzakelijk zijn voor de werking van het keuzebord binnen de onderwijscontext. De verwerking gebeurt op basis van de uitvoering van de dienstverlening en/of een andere geldige rechtsgrond onder de AVG.
                      </p>

                      <div className="space-y-2 mt-2">
                        <table className="w-full text-left text-[10px] border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-105 animate-in fade-in duration-200">
                          <thead className="bg-gray-50 text-[9px] uppercase font-black text-gray-400">
                            <tr>
                              <th className="px-2.5 py-1.5 w-1/4">Categorie</th>
                              <th className="px-2.5 py-1.5 w-1/3">Voorbeelden</th>
                              <th className="px-2.5 py-1.5">Doel</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 font-bold text-gray-500">
                            <tr className="align-top">
                              <td className="px-2.5 py-1.5 text-gray-900 font-black">Accountgegevens leerkracht</td>
                              <td className="px-2.5 py-1.5 font-medium text-[9.5px]">E-mailadres, wachtwoord</td>
                              <td className="px-2.5 py-1.5 font-medium text-[9.5px]">Registratie, beveiligde toegang en beheer van het account en keuzeborden</td>
                            </tr>
                            <tr className="align-top">
                              <td className="px-2.5 py-1.5 text-gray-900 font-black">Klas- en leerlinggegevens</td>
                              <td className="px-2.5 py-1.5 font-medium text-[9.5px]">Door de leerkracht ingevoerde leerlingnamen, keuzes en klasindeling</td>
                              <td className="px-2.5 py-1.5 font-medium text-[9.5px]">Functioneren van het keuzebord en weergave van klasgegevens</td>
                            </tr>
                            <tr className="align-top">
                              <td className="px-2.5 py-1.5 text-gray-900 font-black">Afbeeldingen (optioneel)</td>
                              <td className="px-2.5 py-1.5 font-medium text-[9.5px]">Door de gebruiker geüploade afbeeldingen of avatars</td>
                              <td className="px-2.5 py-1.5 font-medium text-[9.5px]">Weergave binnen de eigen klasomgeving</td>
                            </tr>
                            <tr className="align-top">
                              <td className="px-2.5 py-1.5 text-gray-900 font-black">Technische sessiegegevens</td>
                              <td className="px-2.5 py-1.5 font-medium text-[9.5px]">Sessietokens en functionele cookies</td>
                              <td className="px-2.5 py-1.5 font-medium text-[9.5px]">Authenticatie en technische werking van het Platform</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <p className="text-[10px] text-gray-450 font-normal leading-normal mt-1 bg-gray-50 p-2.5 rounded-xl border border-gray-100 font-semibold">
                        Wij verwerken geen gegevens voor marketingdoeleinden en verzamelen geen niet-noodzakelijke persoonsgegevens zoals adressen of telefoonnummers. Wanneer u inlogt via een externe provider zoals Google of Microsoft, worden enkel de minimale accountgegevens gebruikt die nodig zijn om een leerkrachtenaccount aan te maken en te beheren. Wij verkopen of delen persoonsgegevens niet met derden.
                      </p>
                    </div>

                    {/* 4. Cookies en tracking */}
                    <span className="block border-t border-gray-100 my-4" />
                    <div className="space-y-2">
                      <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-tight flex items-center gap-1.5 animate-in fade-in duration-150">
                        <span className="inline-block w-4 h-4 bg-indigo-100 text-indigo-600 rounded flex items-center justify-center text-[10px] font-extrabold mr-1">✓</span>
                        4. Cookies en tracking
                      </h4>
                      <p className="text-[10.5px] text-gray-550 font-medium font-semibold">
                        Keuzebord gebruikt uitsluitend functionele cookies die noodzakelijk zijn voor de werking van het Platform. Noodzakelijke cookies worden automatisch geplaatst. Voor niet-noodzakelijke cookies geldt dat deze enkel worden gebruikt indien hiervoor toestemming is gegeven.
                      </p>

                      {/* Interactive Cookie Triage Box */}
                      <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-2xl text-[10.5px] space-y-2">
                        <p className="font-extrabold text-indigo-900 text-[11px] uppercase tracking-wide">Uw Huidige Toestemmingsstatus:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-indigo-950">
                          <div>
                            <span className="font-semibold text-gray-500">Toestemmingsniveau:</span>{' '}
                            <span className="font-extrabold bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wide">
                              Toestemming niet vereist voor functionele cookies
                            </span>
                          </div>
                          <div>
                            <span className="font-semibold text-gray-500">Cookie-beleid:</span>{' '}
                            <span className="font-mono text-[9px] bg-white border px-1 py-0.5 rounded text-indigo-700 font-extrabold">
                              100% AVG-conform
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2 pt-2.5">
                          <button
                            type="button"
                            onClick={() => {
                              setShowPrivacyModal(false);
                              setTimeout(() => {
                                window.dispatchEvent(new CustomEvent('open-cookie-settings'));
                              }, 150);
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[9px] uppercase tracking-wider px-3 py-1.5 rounded-lg cursor-pointer transition-all"
                          >
                            Wijzig Cookie-instellingen
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              localStorage.removeItem('keuzebord_cookie_consent');
                              localStorage.removeItem('keuzebord_pref_consent');
                              localStorage.removeItem('keuzebord_session_consent');
                              localStorage.removeItem('fullscreen_pref');
                              window.dispatchEvent(new CustomEvent('cookie-consent-changed'));
                              setShowPrivacyModal(false);
                            }}
                            className="bg-white hover:bg-red-50 text-red-650 border border-red-200 font-extrabold text-[9px] uppercase tracking-wider px-3 py-1.5 rounded-lg cursor-pointer transition-all"
                          >
                            Toestemming Intrekken
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2 mt-3 animate-in fade-in duration-300">
                        <p className="text-[10px] font-extrabold uppercase tracking-wide text-indigo-600">Overzicht van gebruikte Cookies:</p>
                        
                        <div className="space-y-1">
                          <p className="text-[10px] text-gray-900 font-black">Noodzakelijke cookies</p>
                          <p className="text-[9.5px] text-gray-400 leading-normal font-semibold">
                            Helpen een website bruikbaarder te maken door basisfuncties. Zonder deze functioneert het inlogsysteem niet.
                          </p>
                          <table className="w-full text-left text-[9.5px] border border-gray-100 rounded-lg overflow-hidden divide-y divide-gray-100 mt-1">
                            <thead className="bg-gray-50 text-[8px] uppercase font-black text-gray-400">
                              <tr>
                                <th className="px-2 py-1.5 w-1/3">Doel</th>
                                <th className="px-2 py-1.5 w-1/3">Voorbeeld</th>
                                <th className="px-2 py-1.5 text-right">Bewaartermijn</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 font-semibold text-gray-550">
                              <tr>
                                <td className="px-2 py-1.5 text-[9px] text-gray-900 font-bold">Basisfunctionaliteit, beveiliging en inloggen</td>
                                <td className="px-2 py-1.5 font-mono text-indigo-600 text-[9px]">sessie- en authenticatiecookies</td>
                                <td className="px-2 py-1.5 text-[9px] text-right text-gray-400 font-bold">Sessie of tot 1 jaar waar van toepassing</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        <div className="space-y-1 pt-2">
                          <p className="text-[10px] text-indigo-650 font-black">Voorkeurscookies</p>
                          <p className="text-[9.5px] text-gray-400 leading-normal font-semibold">
                            Onthouden van gebruikersinstellingen zoals weergavevoorkeuren.
                          </p>
                          <table className="w-full text-left text-[9.5px] border border-gray-100 rounded-lg overflow-hidden divide-y divide-gray-100 mt-1">
                            <thead className="bg-gray-50 text-[8px] uppercase font-black text-gray-400">
                              <tr>
                                <th className="px-2 py-1.5 w-2/3">Doel</th>
                                <th className="px-2 py-1.5 text-right">Bewaartermijn</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 font-semibold text-gray-550">
                              <tr>
                                <td className="px-2 py-1.5 text-[9px] text-gray-900 font-semibold">Onthouden van gebruikersinstellingen zoals weergavevoorkeuren</td>
                                <td className="px-2 py-1.5 text-[9px] text-right text-gray-400 font-bold">Tot 1 jaar</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        <p className="text-[10px] text-emerald-600 font-black pt-1">
                          ✓ Cruciale verklaring: Keuzebord gebruikt geen advertentie- of marketingcookies en geen tracking voor externe advertentiedoeleinden.
                        </p>
                      </div>
                    </div>

                    {/* 5. Delen van gegevens en beveiliging */}
                    <span className="block border-t border-gray-100 my-4" />
                    <div className="space-y-1.5">
                      <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-tight flex items-center gap-1.5 text-indigo-650 animate-in fade-in duration-150">
                        <span className="inline-block w-4 h-4 bg-indigo-100 text-indigo-600 rounded flex items-center justify-center text-[10px] font-extrabold mr-1">✓</span>
                        5. Delen van gegevens en beveiliging
                      </h4>
                      <p className="text-[10.5px] text-gray-550 font-medium leading-relaxed font-semibold">
                        Persoonsgegevens worden niet verkocht. Wij maken gebruik van externe dienstverleners voor hosting, opslag en technische infrastructuur (zoals cloudproviders). Deze partijen verwerken gegevens uitsluitend in opdracht van Keuzebord ... en mogen deze niet voor eigen doeleinden gebruiken. Wij nemen passende technische en organisatorische maatregelen om persoonsgegevens te protecten. Hoewel wij streven naar een hoog beveiligingsniveau, kan absolute veiligheid niet worden gegarandeerd.
                      </p>
                    </div>

                    {/* 6. Doorgifte buiten de EER */}
                    <span className="block border-t border-gray-100 my-4" />
                    <div className="space-y-1.5">
                      <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-tight flex items-center gap-1.5 text-indigo-650 animate-in fade-in duration-150">
                        <span className="inline-block w-4 h-4 bg-indigo-100 text-indigo-600 rounded flex items-center justify-center text-[10px] font-extrabold mr-1">✓</span>
                        6. Doorgifte buiten de EER
                      </h4>
                      <p className="text-[10.5px] text-gray-550 font-medium leading-relaxed font-semibold">
                        Gegevens worden in principe opgeslagen binnen de Europese Economische Ruimte (EER), onder andere in Europese datacenters. Indien gegevens worden verwerkt door subverwerkers buiten de EER, gebeurt dit uitsluitend onder passende waarborgen overeenkomstig de AVG, zoals door de Europese Commissie goedgekeurde standaardcontractbepalingen.
                      </p>
                    </div>

                    {/* 7. Rechten van betrokkenen */}
                    <span className="block border-t border-gray-100 my-4" />
                    <div className="space-y-1.5">
                      <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-tight flex items-center gap-1.5 text-indigo-650 animate-in fade-in duration-150">
                        <span className="inline-block w-4 h-4 bg-indigo-100 text-indigo-600 rounded flex items-center justify-center text-[10px] font-extrabold mr-1">✓</span>
                        7. Rechten van betrokkenen
                      </h4>
                      <p className="text-[10.5px] text-gray-550 font-medium leading-relaxed font-semibold">
                        Betrokkenen (zoals leerkrachten en eventueel leerlingen) hebben onder de AVG recht op:
                      </p>
                      <ul className="list-disc pl-5 space-y-1 text-gray-650 text-[10.5px] mt-1 font-semibold">
                        <li>inzage</li>
                        <li>correctie</li>
                        <li>beperking van verwerking</li>
                        <li>verwijdering</li>
                        <li>overdraagbaarheid van gegevens</li>
                      </ul>
                      <p className="text-[10.5px] text-gray-550 font-medium leading-relaxed font-semibold mt-1">
                        Deze rechten kunnen worden uitgeoefend via de accountinstellingen of door contact op te nemen met de beheerder. Betrokkenen hebben tevens het recht om een klacht in te dienen bij de Belgische Gegevensbeschermingsautoriteit (GBA).
                      </p>
                    </div>

                    {/* 8. Bewaartermijnen */}
                    <span className="block border-t border-gray-100 my-4" />
                    <div className="space-y-1.5">
                      <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-tight flex items-center gap-1.5 text-indigo-650 animate-in fade-in duration-150">
                        <span className="inline-block w-4 h-4 bg-indigo-100 text-indigo-600 rounded flex items-center justify-center text-[10px] font-extrabold mr-1">✓</span>
                        8. Bewaartermijnen
                      </h4>
                      <p className="text-[10.5px] text-gray-550 font-medium leading-relaxed font-semibold">
                        Gegevens worden niet langer bewaard dan noodzakelijk voor het leveren van de dienst. Accounts die gedurende 24 maanden inactief zijn, kunnen worden gearchiveerd en daarna verwijderd. Gegevens worden eveneens verwijderd op verzoek van de gebruiker, tenzij wettelijke verplichtingen een langere bewaartermijn vereisen.
                      </p>
                    </div>

                    {/* 9. Wijzigingen */}
                    <span className="block border-t border-gray-105 my-4" />
                    <div className="space-y-1.5">
                      <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-tight flex items-center gap-1.5 text-indigo-650 animate-in fade-in duration-150">
                        <span className="inline-block w-4 h-4 bg-indigo-100 text-indigo-600 rounded flex items-center justify-center text-[10px] font-extrabold mr-1">✓</span>
                        9. Wijzigingen
                      </h4>
                      <p className="text-[10.5px] text-gray-550 font-medium leading-relaxed font-semibold">
                        Dit Privacybeleid kan van tijd tot tijd worden bijgewerkt om te voldoen aan gewijzigde wetgeving of technische ontwikkelingen. Wij informeren gebruikers via het Platform over relevante wijzigingen. De datum van de laatste wijziging staat bovenaan dit document vermeld.
                      </p>
                    </div>

                    {/* 10. Contact en klachten */}
                    <span className="block border-t border-gray-105 my-4" />
                    <div className="space-y-1.5">
                      <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-tight flex items-center gap-1.5 text-indigo-650 animate-in fade-in duration-150">
                        <span className="inline-block w-4 h-4 bg-indigo-100 text-indigo-600 rounded flex items-center justify-center text-[10px] font-extrabold mr-1">✓</span>
                        10. Contact en klachten
                      </h4>
                      <p className="text-[10.5px] text-gray-550 font-medium leading-relaxed font-semibold">
                        Voor vragen of klachten met betrekking tot privacy of gegevensverwerking kunt u contact opnemen met de beheerder via de beschikbare contactgegevens binnen het Platform. Wij streven ernaar om vragen zo zorgvuldig en snel mogelijk te behandelen.
                      </p>
                    </div>
                  </div>
                )}

                {legalModalTab === 'terms' && (
                  <div className="space-y-5 animate-in fade-in duration-150">
                    <div className="bg-amber-50/50 text-amber-950 p-4 rounded-2xl space-y-2 border border-amber-100 flex items-start gap-3">
                      <div className="p-2 bg-white text-amber-600 rounded-xl shrink-0 mt-0.5 shadow-sm">
                        <Scale size={18} strokeWidth={2.5} />
                      </div>
                      <div>
                        <p className="font-black text-[11px] uppercase tracking-wide text-amber-900">Algemene Gebruiksvoorwaarden</p>
                        <p className="text-[10.5px] font-semibold text-amber-850 leading-normal">
                          <strong>Laatste update:</strong> 26 mei 2026. Deze voorwaarden zijn van toepassing op het gebruik van het platform Keuzebord. Door het gebruik van het Platform gaat u akkoord met deze voorwaarden.
                        </p>
                      </div>
                    </div>

                    {/* 1. Toepasselijkheid */}
                    <div className="space-y-1.5">
                      <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-tight flex items-center gap-1.5 text-indigo-650 animate-in fade-in duration-150">
                        <span className="inline-block w-4 h-4 bg-indigo-100 text-indigo-600 rounded flex items-center justify-center text-[10px] font-extrabold mr-1">✓</span>
                        1. Toepasselijkheid
                      </h4>
                      <p className="text-[10.5px] text-gray-550 font-medium leading-relaxed font-semibold">
                        Deze voorwaarden zijn van toepassing op elk gebruik van Keuzebord. Door registratie, toegang of gebruik van het Platform komt een overeenkomst tot stand tussen de gebruiker (leerkracht of school) en de ontwikkelaar van Keuzebord. Indien u niet akkoord gaat met deze voorwaarden, dient u het Platform niet te gebruiken.
                      </p>
                    </div>

                    {/* 2. Rollen onder de AVG */}
                    <span className="block border-t border-gray-100 my-4" />
                    <div className="space-y-1.5">
                      <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-tight flex items-center gap-1.5 text-indigo-650 animate-in fade-in duration-150">
                        <span className="inline-block w-4 h-4 bg-indigo-100 text-indigo-600 rounded flex items-center justify-center text-[10px] font-extrabold mr-1">✓</span>
                        2. Rollen onder de AVG
                      </h4>
                      <p className="text-[10.5px] text-gray-550 font-medium leading-relaxed font-semibold">
                        Binnen de context van de AVG/GDPR treedt de gebruiker of school op als verwerkingsverantwoordelijke voor de ingevoerde leerlinggegevens. Keuzebord treedt op als verwerker in opdracht van de gebruiker of school.
                      </p>
                      <p className="text-[10.5px] text-gray-550 font-medium leading-relaxed font-semibold mt-1">
                        De gebruiker is verantwoordelijk voor:
                      </p>
                      <ul className="list-disc pl-5 space-y-1 text-gray-650 text-[10.5px] mt-1 font-semibold">
                        <li>het beschikken over een geldige rechtsgrond voor verwerking van persoonsgegevens</li>
                        <li>het informeren van betrokkenen waar vereist</li>
                        <li>het naleven van interne school- of organisatiebeleid</li>
                        <li>het uitoefenen van rechten van betrokkenen</li>
                      </ul>
                    </div>

                    {/* 3. Beperking van aansprakelijkheid */}
                    <span className="block border-t border-gray-100 my-4" />
                    <div className="space-y-1.5">
                      <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-tight flex items-center gap-1.5 text-indigo-655 animate-in fade-in duration-150">
                        <span className="inline-block w-4 h-4 bg-indigo-100 text-indigo-600 rounded flex items-center justify-center text-[10px] font-extrabold mr-1">✓</span>
                        3. Beperking van aansprakelijkheid
                      </h4>
                      <p className="text-[10.5px] text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100 font-medium leading-relaxed">
                        Het Platform wordt aangeboden op een “as is” en “as available” basis, zonder garanties over beschikbaarheid, foutloos functioneren of geschiktheid voor een specifiek doel.
                      </p>
                      <p className="text-[10.5px] text-gray-550 font-medium leading-relaxed font-semibold mt-1.5">
                        Voor zover wettelijk toegestaan, is de ontwikkelaar niet aansprakelijk voor indirecte schade, gevolgschade, dataverlies of dienstonderbrekingen, behoudens in geval of opzet, zware fout of voor zover uitsluiting wettelijk niet is toegestaan. Dit omvat onder meer:
                      </p>
                      <ul className="list-disc pl-5 space-y-1 text-gray-650 text-[10.5px] mt-1 font-semibold">
                        <li>verlies of corruptie van gegevens</li>
                        <li>technische storingen of downtime</li>
                        <li>beveiligingsincidenten of ongeautoriseerde toegang</li>
                        <li>foutieve of onvolledige gegevensverwerking binnen de applicatie</li>
                      </ul>
                    </div>

                    {/* 4. Verantwoordelijkheid en vrijwaring */}
                    <span className="block border-t border-gray-100 my-4" />
                    <div className="space-y-1.5">
                      <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-tight flex items-center gap-1.5 text-indigo-650 animate-in fade-in duration-150">
                        <span className="inline-block w-4 h-4 bg-indigo-100 text-indigo-600 rounded flex items-center justify-center text-[10px] font-extrabold mr-1">✓</span>
                        4. Verantwoordelijkheid en vrijwaring
                      </h4>
                      <p className="text-[10.5px] text-gray-550 font-medium leading-relaxed font-semibold">
                        De gebruiker of school is verantwoordelijk voor het gebruik van het Platform en voor naleving van de toepasselijke wetgeving, inclusief de AVG/GDPR.
                      </p>
                      <p className="text-[10.5px] text-gray-550 font-medium leading-relaxed font-semibold mt-1">
                        De gebruiker vrijwaart de ontwikkelaar voor claims of aansprakelijkheden die voortvloeien uit onrechtmatig gebruik van het Platform of het ontbreken van een geldige rechtsgrond voor gegevensverwerking.
                      </p>
                    </div>

                    {/* 5. Beëindiging */}
                    <span className="block border-t border-gray-100 my-4" />
                    <div className="space-y-1.5">
                      <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-tight flex items-center gap-1.5 text-indigo-650 animate-in fade-in duration-150">
                        <span className="inline-block w-4 h-4 bg-indigo-100 text-indigo-600 rounded flex items-center justify-center text-[10px] font-extrabold mr-1">✓</span>
                        5. Beëindiging
                      </h4>
                      <p className="text-[10.5px] text-gray-550 font-medium leading-relaxed font-semibold">
                        Zowel de gebruiker als de ontwikkelaar kan de overeenkomst op elk moment beëindigen.
                      </p>
                      <p className="text-[10.5px] text-gray-550 font-medium leading-relaxed font-semibold mt-1">
                        De gebruiker kan zijn account verwijderen via de accountinstellingen, waarna gegevens worden verwijderd voor zover technisch en wettelijk mogelijk. De ontwikkelaar kan toegang tot het Platform beperken of beëindigen in geval van misbruik, overbelasting of schending van deze voorwaarden.
                      </p>
                    </div>

                    {/* 6. Toepasselijk recht */}
                    <span className="block border-t border-gray-100 my-4" />
                    <div className="space-y-1.5">
                      <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-tight flex items-center gap-1.5 text-indigo-650 animate-in fade-in duration-150">
                        <span className="inline-block w-4 h-4 bg-indigo-100 text-indigo-600 rounded flex items-center justify-center text-[10px] font-extrabold mr-1">✓</span>
                        6. Toepasselijk recht
                      </h4>
                      <p className="text-[10.5px] text-gray-550 font-medium leading-relaxed font-semibold">
                        Op deze voorwaarden is Belgisch recht van toepassing. Geschillen worden voorgelegd aan de bevoegde rechtbanken in België, behoudens dwingendrechtelijke bepalingen die anders bepalen.
                      </p>
                    </div>
                  </div>
                )}

                {legalModalTab === 'contact' && (
                  <div className="space-y-5 animate-in fade-in duration-150">
                    <div className="bg-indigo-50/50 text-indigo-950 p-4 rounded-2xl space-y-2 border border-indigo-100 flex items-start gap-3">
                      <div className="p-2.5 bg-white text-indigo-600 rounded-xl shrink-0 mt-0.5 shadow-sm">
                        <Mail size={18} strokeWidth={2.5} />
                      </div>
                      <div>
                        <p className="font-black text-[11px] uppercase tracking-wide text-indigo-900">Over Keuzebord & Contact</p>
                        <p className="text-[10.5px] font-semibold text-indigo-850 leading-normal">
                          Heb je vragen, opmerkingen of ervaar je technische uitdagingen? We helpen je graag persoonlijk verder om het gebruik in jouw klaslokaal zo vlot mogelijk te laten verlopen.
                        </p>
                      </div>
                    </div>

                    {/* Hobbyproject informatie */}
                    <div className="space-y-1.5">
                      <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-tight flex items-center gap-1.5 text-indigo-650">
                        <span className="inline-block w-4 h-4 bg-indigo-100 text-indigo-600 rounded flex items-center justify-center text-[10px] font-extrabold mr-1">✓</span>
                        Een warm hobbyproject
                      </h4>
                      <p className="text-[10.5px] text-gray-550 font-medium leading-relaxed font-semibold">
                        Keuzebord is met veel toewijding en zorg gebouwd als een onafhankelijk <strong>hobbyproject</strong> met een warm hart voor het onderwijs. Onze missie is simpel: leerkrachten en scholen voorzien van een betrouwbaar, flexibel en visueel aantrekkelijk digitaal keuzebord, zonder overbodige commerciële of administratieve ballast.
                      </p>
                    </div>

                    {/* Meteen actie bij problemen */}
                    <span className="block border-t border-gray-100 my-4" />
                    <div className="space-y-1.5">
                      <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-tight flex items-center gap-1.5 text-indigo-650">
                        <span className="inline-block w-4 h-4 bg-indigo-100 text-indigo-600 rounded flex items-center justify-center text-[10px] font-extrabold mr-1">✓</span>
                        Meteen actie bij problemen & feedback
                      </h4>
                      <p className="text-[10.5px] text-gray-550 font-medium leading-relaxed font-semibold">
                        Omdat dit een kleinschalig project is, zijn de communicatielijnen uiterst kort en persoonlijk! We begrijpen als geen ander hoe belangrijk een feilloze en stabiele werking in het klaslokaal of op het digibord is.
                      </p>
                      <p className="text-[10.5px] text-gray-550 font-medium leading-relaxed font-semibold mt-1">
                        Bij eventuele technische fouten, storingen of andere problemen willen en zullen we dan ook <strong>meteen gerichte actie ondernemen</strong> om de situatie adequaat te herstellen en op te lossen. Jouw belevingskwaliteit en het gemak in jouw klas zijn onze absolute prioriteit!
                      </p>
                    </div>

                    {/* Contact Venster */}
                    <span className="block border-t border-gray-100 my-4" />
                    <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl space-y-3 animate-in zoom-in-95 duration-150">
                      <p className="font-extrabold text-emerald-950 text-[11px] uppercase tracking-wide flex items-center gap-1.5">
                        <Mail size={14} className="text-emerald-700 font-extrabold" />
                        Direct contact met de beheerder
                      </p>
                      
                      <div className="space-y-2 text-emerald-950 text-[10.5px] font-semibold leading-relaxed">
                        <p>
                          Je kunt ons rechtstreeks bereiken via het onderstaande e-mailadres voor al je vragen, bugs of verbetersuggesties:
                        </p>
                        
                        <div className="bg-white border border-emerald-150 p-3.5 rounded-xl flex items-center justify-between shadow-sm">
                          <span className="font-mono text-emerald-800 font-extrabold select-all text-xs md:text-sm">
                            stonetree15@gmail.com
                          </span>
                          <span className="text-[9px] bg-emerald-100 text-emerald-700 uppercase font-black tracking-widest px-1.5 py-0.5 rounded">
                            Support Contact
                          </span>
                        </div>
                        
                        <p className="text-[10px] text-emerald-750 font-bold italic">
                          * We doen er alles aan om alle inkomende berichten uiterst snel op te volgen en problemen meteen te tackelen!
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end shrink-0">
                <Button 
                  onClick={() => setShowPrivacyModal(false)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[10px] py-5 px-8 rounded-xl shadow-md cursor-pointer"
                >
                  Ik begrijp het & Sluit
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Simple helper icon for the modal list categories
const CheckSquareIcon = () => (
  <span className="inline-block w-4 h-4 bg-indigo-100 text-indigo-600 rounded flex items-center justify-center text-[10px] font-extrabold mr-1">
    ✓
  </span>
);
