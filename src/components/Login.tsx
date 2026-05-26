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
  const [legalModalTab, setLegalModalTab] = React.useState<'privacy' | 'terms'>('privacy');

  const isUnverified = user && !user.emailVerified && user.providerData.some(p => p.providerId === 'password');

  const handleSocialLogin = async () => {
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

              {isSignUp && (
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
                    Ik ga uitdrukkelijk akkoord met het sluiten van de bindende <button type="button" onClick={() => { setLegalModalTab('terms'); setShowPrivacyModal(true); }} className="text-indigo-600 hover:underline font-black">Algemene Gebruikersvoorwaarden</button> (inclusief de volledige uitsluiting van aansprakelijkheid) en de <button type="button" onClick={() => { setLegalModalTab('privacy'); setShowPrivacyModal(true); }} className="text-indigo-600 hover:underline font-black">Privacyverklaring</button>. Ik bevestig dat ik of de school de wettelijk vereiste toestemming bezit voor alle leerlingen onder de 16 jaar.
                  </label>
                </div>
              )}

              <Button 
                type="submit"
                disabled={isSubmitting || (isSignUp && !privacyAccepted)}
                className={`w-full py-6 text-lg font-black uppercase tracking-widest shadow-md transition-all active:scale-95 ${
                  isSignUp && !privacyAccepted 
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
              </div>
              <div className="bg-amber-50/80 border border-amber-100 rounded-xl p-2.5 text-center shadow-inner">
                <p className="text-[8px] font-black text-amber-800 uppercase tracking-wider mb-0.5">Disclaimer & Aansprakelijkheid</p>
                <p className="text-[7.5px] font-semibold text-amber-700 leading-tight">
                  Door in te loggen of te registreren ga je akkoord met deze bindende voorwaarden. De applicatie wordt geleverd "in de huidige staat" (as-is) zonder enige garanties. De ontwikkelaar/auteur is op geen enkele wijze aansprakelijk voor dataverlies, beveiligingsincidenten, schade of de werking van het systeem. Het gebruik geschiedt volledig op eigen risico.
                </p>
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
                    {legalModalTab === 'privacy' ? <ShieldCheck size={22} strokeWidth={2.5} /> : <Scale size={22} strokeWidth={2.5} />}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-950 uppercase tracking-tight font-sans">
                      {legalModalTab === 'privacy' ? 'Privacyverklaring & Cookies' : 'Algemene Gebruikersvoorwaarden & EULA'}
                    </h3>
                    <p className="text-[8px] font-bold text-indigo-500 uppercase tracking-widest leading-none mt-1">
                      {legalModalTab === 'privacy' 
                        ? 'In overeenstemming met de AVG / GDPR & Belgische Privacywetgeving' 
                        : 'Juridisch bindende overeenkomst en volledige aansprakelijkheidsuitsluiting'}
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
              </div>

              <div className="p-6 space-y-5 overflow-y-auto text-xs text-gray-600 leading-relaxed font-bold custom-scrollbar flex-1">
                {legalModalTab === 'privacy' ? (
                  <div className="space-y-5 animate-in fade-in duration-150">
                    <div className="bg-indigo-50/50 text-indigo-900 p-4 rounded-2xl space-y-2 border border-indigo-100">
                      <p className="font-black text-[11.5px] uppercase tracking-wide">Bij Keuzebord hechten we grote waarde aan de privacy van jou én je leerlingen.</p>
                      <p className="text-[10.5px] font-semibold text-indigo-700 leading-relaxed">
                        Omdat deze applicatie in klaslokalen wordt ingezet voor jonge kleuters en leerlingen onder de 16 jaar, hebben we de gegevensverwerking tot een absoluut minimum beperkt en maximaal beveiligd. Hieronder lees je exact welke persoonsgegevens we wel en niet verwerken.
                      </p>
                    </div>

                    {/* Welke gegevens gebruikt deze app? */}
                    <div className="space-y-2">
                      <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-tight flex items-center gap-1.5">
                        <CheckSquareIcon /> 1. Welke gegevens worden verwerkt en waarom?
                      </h4>
                      <p className="text-[10.5px] font-medium text-gray-505">
                        Wij verwerken uitsluitend gegevens die noodzakelijk zijn om het klas-keuzebord te laten functioneren, bezochte hoeken te analyseren en de accounts van leerkrachten te beveiligen:
                      </p>
                      <ul className="list-disc pl-5 space-y-1 text-gray-650 text-[10.5px]">
                        <li><strong>E-mailadres & accountgegevens:</strong> Van jou (de leerkracht) om je account aan te maken, veilig in te loggen en je gegevens te synchroniseren zodat ze niet verloren gaan.</li>
                        <li><strong>Voor- en achternamen van leerlingen:</strong> Dit wordt ingevoerd door de leerkracht om de leerlingen op de digitale houten blokjes/kaartjes weer te geven. Inactieve accounts en namen worden na 2 jaar inactiviteit gewist.</li>
                        <li><strong>Foto/Afbeelding (Optioneel):</strong> De leerkracht heeft de optie om een foto/avatar te koppelen aan een leerling. Dit wordt direct versleuteld en beveiligd opgeslagen op onze Firebase-cloudopslag.</li>
                        <li><strong>IP-adres & Technische logs:</strong> Je browser- of apparaattype en IP-adres worden automatisch gelogd door de hostinginfrastructuur (Google Firebase). Dit gebeurt puur voor netwerkbeveiliging (zoals brute-force inlogaanvallen voorkomen) en storingsdiagnose. Deze logbestanden worden na maximaal 30 dagen overschreven.</li>
                        <li><strong>Activiteiten & Evaluaties:</strong> De app houdt bij welke leerlingen op welk moment welke hoek hebben gekozen en eventueel hun humeur-/smileyevaluaties, om educatieve statistieken voor de leerkracht te berekenen.</li>
                      </ul>
                    </div>

                    {/* Welke gegevens verwerken we NIET? */}
                    <span className="block border-t border-gray-100 my-4" />
                    <div className="space-y-2">
                      <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-tight flex items-center gap-1.5 text-indigo-650">
                        <CheckSquareIcon /> 2. Welke gegevens gebruiken we absoluut NIET?
                      </h4>
                      <p className="text-[10.5px] font-medium text-gray-505">
                        Er is geen enkele functionele reden of juridische basis om gevoelige of bijzondere overheidsgegevens van leerlingen op te slaan. Wij slaan daarom de volgende informatie <strong>NIET</strong> op:
                      </p>
                      <table className="w-full text-left text-[10.5px] border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-100">
                        <thead className="bg-gray-50 text-[9px] uppercase font-black tracking-wider text-gray-400">
                          <tr>
                            <th className="px-3 py-2">Categorie</th>
                            <th className="px-3 py-2 text-center">Status</th>
                            <th className="px-3 py-2">Toelichting</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-105 font-bold text-gray-600">
                          <tr>
                            <td className="px-3 py-2"><strong>BSN / Rijksregisternummer</strong></td>
                            <td className="px-3 py-2 text-center text-red-600 font-extrabold text-[9px]">❌ GEEN VERWERKING</td>
                            <td className="px-3 py-2 text-gray-500 font-semibold text-[9.5px]">Alleen gemachtigde overheidsinstanties mogen het BSN gebruiken. Wij vragen of bewaren dit nooit.</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2"><strong>Bank- of financiële gegevens</strong></td>
                            <td className="px-3 py-2 text-center text-red-600 font-extrabold text-[9px]">❌ GEEN VERWERKING</td>
                            <td className="px-3 py-2 text-gray-500 font-semibold text-[9.5px]">Deze website is gratis in gebruik. We verwerken geen betaal- of creditcardgegevens.</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2"><strong>Bijzondere Persoonsgegevens</strong></td>
                            <td className="px-3 py-2 text-center text-red-600 font-extrabold text-[9px]">❌ GEEN VERWERKING</td>
                            <td className="px-3 py-2 text-gray-500 font-semibold text-[9.5px]">Informatie over ras, godsdienst, politieke voorkeur, medische status of seksuele geaardheid is strikt verboden te bewaren.</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2"><strong>Surfgedrag- & Marketingcookies</strong></td>
                            <td className="px-3 py-2 text-center text-red-600 font-extrabold text-[9px]">❌ GEEN VERWERKING</td>
                            <td className="px-3 py-2 text-gray-500 font-semibold text-[9.5px]">Wij maken geen gebruik van advertentienetwerken of marketingtrackers om surfgedrag over websites heen te volgen.</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Minderjarigen en leerlingen jonger dan 16 */}
                    <span className="block border-t border-gray-100 my-4" />
                    <div className="space-y-2 p-4 bg-orange-50/70 text-orange-950 border border-orange-100 rounded-2xl">
                      <h4 className="font-sans font-black text-[11px] uppercase tracking-tight text-orange-850 flex items-center gap-1.5 flex-row">
                        <Scale size={16} /> 3. Leerlingen jonger dan 16 jaar
                      </h4>
                      <p className="text-[10.5px] font-semibold leading-relaxed">
                        De kleuters en scholieren die gebruik maken van het fysieke of digitale keuzebord zijn in de regel jonger dan 16 jaar. 
                      </p>
                      <p className="text-[10.5px] font-medium text-orange-900 mt-1 leading-relaxed">
                        Op grond van de AVG/GDPR is hiervoor wettelijk toestemming vereist van ouders of voogden. De school of jij als leerkracht verklaart bij registratie dat deze toestemming geregeld is onder de algemene AVG-richtlijnen van de school of dat ouders hiervoor uitdrukkelijke toestemming hebben gegeven (bijv. voor het gebruik van hun naam en/of foto in de beveiligde schoolomgeving).
                      </p>
                    </div>

                    {/* Bewaartermijnen */}
                    <span className="block border-t border-gray-100 my-4" />
                    <div className="space-y-2">
                      <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-tight flex items-center gap-1.5 text-indigo-650">
                        <Eye size={16} /> 4. Hoe lang worden gegevens bewaard? (Bewaartermijnen)
                      </h4>
                      <p className="text-[10.5px] font-medium text-gray-505">
                        Wij bewaren gegevens niet langer dan noodzakelijk voor het functionele doel:
                      </p>
                      <ul className="list-disc pl-5 space-y-1 text-gray-650 text-[10.5px]">
                        <li><strong>Actieve Accounts:</strong> Zolang je account actief gebruikt wordt, bewaren we je klasgegevens zodat je dagelijks direct aan de slag kunt. Accounts die al twee jaar inactief zijn, worden automatisch verwijderd.</li>
                        <li><strong>Definitieve verwijdering door jou:</strong> Je hebt onder de AVG het recht om vergeten te worden. Je kunt op elk gewenst moment ál je leerlingen, afbeeldingen, keuzes en je hele account met één klik <strong>permanent</strong> en definitief vernietigen. Dit regelt de app technisch direct via de knop <em>"Account verwijderen"</em> in het dropdown-menu van je profiel.</li>
                      </ul>
                    </div>

                    {/* Derden & Verwerkers */}
                    <span className="block border-t border-gray-100 my-4" />
                    <div className="space-y-2">
                      <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-tight flex items-center gap-1.5 text-emerald-600">
                        <ShieldCheck size={16} /> 5. Delen met derden / ICT-Verwerkers
                      </h4>
                      <p className="text-[10.5px] font-medium text-gray-550 leading-relaxed">
                        Keuzebord verkoopt of deelt NOOIT gegevens met derden. We maken uitsluitend gebruik van gecertificeerde hostingpartners om de service stabiel en veilig in te richten:
                      </p>
                      <div className="p-3.5 bg-gray-50 rounded-xl space-y-1 text-[10.5px] border border-gray-100 leading-relaxed font-semibold text-gray-600">
                        <p><strong>Subverwerker:</strong> Google Firebase Cloud (Google Cloud Platform Inc.)</p>
                        <p><strong>Doel:</strong> Beveiligde database-opslag (Cloud Firestore) en authenticatie-infrastructuur (Firebase Authentication) op serverlocaties binnen de Europese Unie (EU).</p>
                        <p className="text-[10px] text-gray-400 font-bold leading-normal">Er zijn sluitende modelcontractbepalingen (Verwerkersovereenkomst) van kracht met Google Cloud om de strikte geheimhouding, back-ups en ISO 27001-informatiebeveiliging te garanderen.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-5 animate-in fade-in duration-150">
                    <div className="bg-amber-50/70 text-amber-950 p-4 rounded-2xl space-y-2 border border-amber-100 flex items-start gap-3">
                      <div className="p-2 bg-white text-amber-600 rounded-xl shrink-0 mt-0.5 shadow-sm">
                        <AlertTriangle size={18} strokeWidth={2.5} />
                      </div>
                      <div>
                        <p className="font-black text-[11px] uppercase tracking-wide text-amber-900">Belangrijke Juridische Vrijwaring & Contract</p>
                        <p className="text-[10.5px] font-semibold text-amber-800 leading-normal">
                          Lees deze voorwaarden aandachtig door. Door gebruik te maken van dit platform (Keuzebord) sluit je een bindende, wettelijke overeenkomst en vrijwaar je de ontwikkelaar/auteur volledig van elke aansprakelijkheid.
                        </p>
                      </div>
                    </div>

                    {/* Art 1. Toepasselijkheid en Doel */}
                    <div className="space-y-1.5">
                      <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-tight flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded bg-gray-100 text-[9px] font-black flex items-center justify-center text-indigo-600">1</span>
                        Art 1. Toepasselijkheid & Contractsluiting
                      </h4>
                      <p className="text-[10.5px] text-gray-500 font-medium leading-relaxed">
                        Deze Algemene Gebruikersvoorwaarden gelden voor elk gebruik van het platform Keuzebord. Door de applicatie te openen, te registreren of in te loggen, ontstaat er een bindend contract tussen de gebruiker (leerkracht of de vertegenwoordigde school) en de onafhankelijke ontwikkelaar/auteur van Keuzebord. Indien je niet akkoord gaat met alle bepalingen, ben je niet gemachtigd om de app te gebruiken.
                      </p>
                    </div>

                    {/* Art 2. GDPR Rol & Privacy Verplichtingen */}
                    <span className="block border-t border-gray-100 my-4" />
                    <div className="space-y-1.5">
                      <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-tight flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded bg-gray-100 text-[9px] font-black flex items-center justify-center text-indigo-600">2</span>
                        Art 2. GDPR Rollen: Gebruiker is de "Verwerkingsverantwoordelijke"
                      </h4>
                      <p className="text-[10.5px] text-gray-500 font-medium leading-relaxed">
                        Onder de Europese Algemene Verordening Gegevensbescherming (AVG / GDPR) treedt de gebruiker (of de desbetreffende school) op als de <strong>Verwerkingsverantwoordelijke ("Data Controller")</strong> voor alle ingevoerde leerlingengegevens (zoals namen, klasbezetting, hoekenstatistieken en optionele foto's).
                      </p>
                      <p className="text-[10.5px] text-gray-500 font-medium leading-relaxed mt-1">
                        De applicatie en haar ontwikkelaar fungeren louter als een <strong>technische passieve ICT-dienstverlener</strong>. De gebruiker/school draagt de volledige en exclusieve verantwoordelijkheid om:
                      </p>
                      <ul className="list-disc pl-5 space-y-1 text-gray-600 text-[10.5px] mt-1">
                        <li>Voorafgaande, geldige toestemming van de ouders of wettelijke voogden van de leerlingen (jonger dan 16 jaar) te verkrijgen voor de invoer en verwerking van namen en foto's.</li>
                        <li>De rechten van de betrokkene (recht op inzage, correctie, data-export of verwijdering) jegens ouders en leerlingen uit te voeren.</li>
                        <li>Te verifiëren dat het gebruik van deze cloud-applicatie conform het interne privacyreglement van de desbetreffende school of scholenkoepel is.</li>
                      </ul>
                    </div>

                    {/* Art 3. Volledige Exoneratie en Uitsluiting Aansprakelijkheid */}
                    <span className="block border-t border-gray-100 my-4" />
                    <div className="space-y-1.5">
                      <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-tight flex items-center gap-1.5 text-red-650">
                        <span className="w-4 h-4 rounded bg-red-50 text-[9px] font-black flex items-center justify-center text-red-600">3</span>
                        Art 3. Totale Uitsluiting van Aansprakelijkheid (Exoneratie)
                      </h4>
                      <p className="text-[10.5px] text-red-900 bg-red-50/50 p-3 rounded-xl border border-red-105 font-medium leading-relaxed">
                        De applicatie wordt geleverd op een <strong>"as-is" (in de huidige feitelijke en juridische staat)</strong> en "as available" basis, zonder enige expliciete of impliciete garanties omtrent de werking, geschiktheid voor een specifiek doel, bugvrijheid of ononderbroken beschikbaarheid.
                      </p>
                      <p className="text-[10.5px] text-gray-500 font-medium leading-relaxed mt-1.5">
                        Voor zover wettelijk toegestaan onder het Belgische en Europese recht (inclusief het Nieuw Belgisch Burgerlijk Wetboek), is de ontwikkelaar/auteur onder <strong>geen enkele omstandigheid</strong> aansprakelijk voor enige directe, indirecte, incidentele, bijzondere of gevolgschade. Dit omvat, maar is niet beperkt tot:
                      </p>
                      <ul className="list-disc pl-5 space-y-1 text-gray-600 text-[10.5px] mt-1">
                        <li><strong>Dataverlies of corruptie:</strong> Verlies of onbeschikbaarheid van leerlingengegevens, statistieken of instellingen in de Firestore online database.</li>
                        <li><strong>Infrastructuurstoringen:</strong> Technische storingen, uitval van de applicatieserver, of onbereikbaarheid op smartboards of tablets tijdens schooluren.</li>
                        <li><strong>Beveiligingsincidenten:</strong> Datalekken, hackaanvallen, of ongeoorloofde toegang tot gebruikersaccounts via phishing of zwakke wachtwoorden.</li>
                        <li><strong>Pedagogische of administratieve fouten:</strong> Eventuele foutieve keuze-registraties of foute statistieken bij humeurevaluaties.</li>
                      </ul>
                    </div>

                    {/* Art 4. Vrijwaring */}
                    <span className="block border-t border-gray-100 my-4" />
                    <div className="space-y-1.5">
                      <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-tight flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded bg-gray-100 text-[9px] font-black flex items-center justify-center text-indigo-600">4</span>
                        Art 4. Vrijwaring (Indemnification)
                      </h4>
                      <p className="text-[10.5px] text-gray-500 font-medium leading-relaxed">
                        De gebruiker en/of de school stemmen er onherroepelijk mee in de ontwikkelaar/auteur van Keuzebord volledig te verdedigen, te <strong>vrijwaren</strong> en schadeloos te stellen tegen alle claims, aansprakelijkheden, schadevergoedingen, boetes (inclusief administratieve boetes opgelegd door de Belgische Gegevensbeschermingsautoriteit (GBA) of toezichthouders), kosten of uitgaven (inclusief advocaatkosten) die voortvloeien uit of verband houden met de invoer van leerlinggegevens zonder ouderlijke toestemming of enige inbreuk op de verplichtingen onder de AVG/GDPR.
                      </p>
                    </div>

                    {/* Art 5. Beëindiging en Recht tot Vergetelheid */}
                    <span className="block border-t border-gray-100 my-4" />
                    <div className="space-y-1.5">
                      <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-tight flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded bg-gray-100 text-[9px] font-black flex items-center justify-center text-indigo-600">5</span>
                        Art 5. Beëindiging & Permanente Verwijdering
                      </h4>
                      <p className="text-[10.5px] text-gray-500 font-medium leading-relaxed">
                        Zowel de gebruiker als de ontwikkelaar heeft het recht de overeenkomst op elk moment op te zeggen. De gebruiker kan dit doen door de knop "Account verwijderen" te gebruiken. Dit verwijdert onherroepelijk en permanent alle klassen, leerlingen en instellingen van onze servers. De ontwikkelaar behoudt zich het recht voor om bij misbruik, buitensporige belasting van servers of inbreuk op deze voorwaarden, de toegang tot het platform direct te blokkeren zonder voorafgaande kennisgeving en zonder recht op schadevergoeding.
                      </p>
                    </div>

                    {/* Art 6. Toepasselijk recht en bevoegde rechtbanken */}
                    <span className="block border-t border-gray-100 my-4" />
                    <div className="space-y-1.5">
                      <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-tight flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded bg-gray-100 text-[9px] font-black flex items-center justify-center text-emerald-600">6</span>
                        Art 6. Toepasselijk recht & Bevoegde rechtbanken
                      </h4>
                      <p className="text-[10.5px] text-gray-500 font-medium leading-relaxed">
                        Op deze overeenkomst, de Algemene Gebruikersvoorwaarden en alle geschillen die hieruit voortvloeien, is uitsluitend het <strong>Belgisch recht</strong> van toepassing. Alle geschillen van welke aard dan ook zullen bij uitsluiting worden voorgelegd aan de bevoegde rechtbanken van de maatschappelijke zetel van de ontwikkelaar of diens woonplaats in België.
                      </p>
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
