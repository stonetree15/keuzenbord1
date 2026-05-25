import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { LogIn, Mail, Lock, UserPlus } from 'lucide-react';
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

              <Button 
                type="submit"
                disabled={isSubmitting}
                className="w-full py-6 text-lg font-black uppercase tracking-widest bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all active:scale-95"
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
              <div className="bg-amber-50/80 border border-amber-100 rounded-xl p-2.5 text-center shadow-inner">
                <p className="text-[8px] font-black text-amber-800 uppercase tracking-wider mb-0.5">Disclaimer & Aansprakelijkheid</p>
                <p className="text-[7.5px] font-semibold text-amber-700 leading-tight">
                  Door in te loggen of te registreren accepteer je dat deze applicatie "in de huidige staat" (as-is) wordt geleverd zonder enige garanties. De ontwikkelaar/auteur is op geen enkele wijze aansprakelijk voor dataverlies, beveiligingsincidenten, schade, of de werking van het systeem. Het gebruik geschiedt volledig op eigen risico.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
