import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldAlert, Cookie, ChevronRight, X, Sparkles, Scale, Info, Check, Settings2, ShieldCheck, Eye } from 'lucide-react';

export const CookieBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'advanced'>('info');

  // Consent states - optional categories must default to false under GDPR/Planet49
  const [preferenceEnabled, setPreferenceEnabled] = useState<boolean>(() => {
    const stored = localStorage.getItem('keuzebord_pref_consent');
    return stored === 'true'; // Default to false (not checked) if not stored yet
  });
  const [sessionConsentEnabled, setSessionConsentEnabled] = useState<boolean>(() => {
    const stored = localStorage.getItem('keuzebord_session_consent');
    return stored === 'true'; // Default to false (not checked) if not stored yet
  });

  useEffect(() => {
    // Check if user has already accepted/dismissed cookie info
    const isConsentGiven = localStorage.getItem('keuzebord_cookie_consent');
    if (!isConsentGiven) {
      // Small timeout to make the entry transition feel natural
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const handleOpenCookieSettings = () => {
      setActiveTab('info');
      setShowDetailsModal(true);
    };
    window.addEventListener('open-cookie-settings', handleOpenCookieSettings);
    return () => window.removeEventListener('open-cookie-settings', handleOpenCookieSettings);
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('keuzebord_cookie_consent', 'accepted');
    localStorage.setItem('keuzebord_pref_consent', 'true');
    localStorage.setItem('keuzebord_session_consent', 'true');
    setPreferenceEnabled(true);
    setSessionConsentEnabled(true);
    setIsVisible(false);
  };

  const handleRejectAll = () => {
    localStorage.setItem('keuzebord_cookie_consent', 'rejected');
    localStorage.setItem('keuzebord_pref_consent', 'false');
    localStorage.setItem('keuzebord_session_consent', 'false');
    setPreferenceEnabled(false);
    setSessionConsentEnabled(false);
    
    // Act immediately on opt-out: remove any stored functional values
    localStorage.removeItem('fullscreen_pref');
    
    setIsVisible(false);
  };

  const handleSavePreferences = () => {
    localStorage.setItem('keuzebord_cookie_consent', 'accepted');
    localStorage.setItem('keuzebord_pref_consent', preferenceEnabled ? 'true' : 'false');
    localStorage.setItem('keuzebord_session_consent', sessionConsentEnabled ? 'true' : 'false');
    
    // Act immediately on opt-out
    if (!preferenceEnabled) {
      localStorage.removeItem('fullscreen_pref');
    }
    
    setIsVisible(false);
    setShowDetailsModal(false);
  };

  if (!isVisible && !showDetailsModal) return null;

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 25 }}
            className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md bg-white border-2 border-indigo-100 shadow-2xl rounded-3xl p-5 z-[500] flex flex-col gap-4 text-left antialiased"
          >
            <div className="flex gap-3.5 items-start">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl shrink-0 mt-0.5">
                <Cookie size={24} className="animate-pulse" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-black text-gray-950 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                  Functionele Cookies & Privacy
                </h4>
                <p className="text-[10.5px] text-gray-650 font-bold leading-normal">
                  Keuzebord gebruikt uitsluitend <strong>strikt noodzakelijke en functionele</strong> cookies en lokale opslag (zoals je inlogsessie). Dit is wettelijk vereist om de app veilig en stabiel te laten functioneren. Wij gebruiken <strong>geen</strong> tracking- of marketingcookies.
                </p>
              </div>
            </div>

            <div className="flex gap-2 items-center justify-between border-t border-gray-50 pt-3 flex-wrap sm:flex-nowrap">
              <button
                onClick={() => {
                  setActiveTab('info');
                  setShowDetailsModal(true);
                }}
                className="px-2.5 py-2 text-[10px] font-bold text-gray-500 hover:text-indigo-600 transition-all uppercase tracking-wider rounded-xl hover:bg-indigo-50/50 cursor-pointer"
              >
                Instellingen
              </button>
              <div className="flex gap-1.5 items-center justify-end">
                <button
                  onClick={handleRejectAll}
                  className="px-3 py-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest cursor-pointer whitespace-nowrap"
                >
                  Alles Weigeren
                </button>
                <button
                  onClick={handleAcceptAll}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-md hover:shadow-indigo-100 transition-all active:scale-95 cursor-pointer whitespace-nowrap flex items-center gap-1"
                >
                  <Check size={12} strokeWidth={3} />
                  Alles Accepteren
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Details Modal */}
      <AnimatePresence>
        {showDetailsModal && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[600] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[2rem] border-2 border-gray-100 shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden text-left"
            >
              <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-2xl">
                    <ShieldAlert size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-950 uppercase tracking-tight font-sans">Cookie & Storage Beheer</h3>
                    <p className="text-[8px] font-bold text-indigo-500 uppercase tracking-widest leading-none mt-0.5">Conform de Belgische APD / GBA & Europese AVG richtlijnen</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all font-black text-gray-500 cursor-pointer text-xs"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-gray-100 bg-gray-50/30 px-5 gap-1 pt-2">
                <button
                  onClick={() => setActiveTab('info')}
                  className={`px-4 py-3 font-black text-[10px] uppercase tracking-wider rounded-t-xl transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'info'
                      ? 'border-indigo-600 text-indigo-650 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.02)]'
                      : 'border-transparent text-gray-400 hover:text-gray-600 bg-transparent'
                  }`}
                >
                  <Info size={14} />
                  Algemene Informatie
                </button>
                <button
                  onClick={() => setActiveTab('advanced')}
                  className={`px-4 py-3 font-black text-[10px] uppercase tracking-wider rounded-t-xl transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'advanced'
                      ? 'border-indigo-600 text-indigo-650 bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.02)]'
                      : 'border-transparent text-gray-400 hover:text-gray-600 bg-transparent'
                  }`}
                >
                  <Settings2 size={14} />
                  Geavanceerd & Toestemming
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-5 text-xs text-gray-650 font-bold custom-scrollbar flex-1">
                {activeTab === 'info' ? (
                  <>
                    <div className="p-3.5 bg-indigo-50/50 text-indigo-950 rounded-2xl border border-indigo-100 space-y-1 animate-in fade-in duration-150">
                      <span className="text-[12px] font-black uppercase tracking-wide flex items-center gap-1">
                        <Sparkles size={14} /> Transparantie Voorop
                      </span>
                      <p className="text-[10.5px] leading-relaxed font-semibold text-indigo-700">
                        Omdat Keuzebord ontworpen is voor scholen en kleuterklassen, sluiten we elke vorm van marketing, tracking of advertentie-cookies uit. Dit minimaliseert de digitale voetafdruk en privacy-risico's voor de leerkracht en leerlingen volledig.
                      </p>
                    </div>

                    {/* Overzicht tabel */}
                    <div className="space-y-2 animate-in fade-in duration-150">
                      <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Info size={14} className="text-indigo-600" /> Overzicht van opslag (Cookies & LocalStorage)
                      </h4>
                      <p className="text-[10px] text-gray-400 font-medium">
                        Hieronder vind je een transparante lijst met de exacte functionele sleutels die in de internetbrowser worden vastgelegd door deze webapplicatie:
                      </p>

                      <table className="w-full text-left text-[11px] border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-100">
                        <thead className="bg-gray-50 text-[9px] uppercase font-black tracking-wider text-gray-400">
                          <tr>
                            <th className="px-3 py-2">Sleutel / Cookie</th>
                            <th className="px-3 py-2">Type</th>
                            <th className="px-3 py-2">Doel & Werking</th>
                            <th className="px-3 py-2">Bewaartermijn</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-semibold text-gray-600 text-[10.5px]">
                          <tr>
                            <td className="px-3 py-2.5 font-mono text-indigo-650">firebase:uid</td>
                            <td className="px-3 py-2.5">Local Storage</td>
                            <td className="px-3 py-2.5">Houdt de leerkracht veilig ingelogd in zijn/haar eigen beveiligde schoolaccount.</td>
                            <td className="px-3 py-2.5">Tot uitloggen</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2.5 font-mono text-indigo-650">keuzebord_cookie_consent</td>
                            <td className="px-3 py-2.5">Local Storage</td>
                            <td className="px-3 py-2.5">Onthoudt dat je akkoord bent gegaan met deze privacy/cookie verklaring zodat we de banner niet opnieuw tonen.</td>
                            <td className="px-3 py-2.5">1 jaar</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2.5 font-mono text-indigo-650">is_admin</td>
                            <td className="px-3 py-2.5">Session Storage</td>
                            <td className="px-3 py-2.5">Houdt tijdelijk bij of de leerkracht momenteel in de beveiligde beheermodus zit of in de kleutermodus.</td>
                            <td className="px-3 py-2.5">Sessie-duur</td>
                          </tr>
                          <tr>
                            <td className="px-3 py-2.5 font-mono text-indigo-650">fullscreen_pref</td>
                            <td className="px-3 py-2.5">Local Storage</td>
                            <td className="px-3 py-2.5">Slaat de schermvoorkeur op (bijv. schermvullend houten keuzebordbord op een smartboard).</td>
                            <td className="px-3 py-2.5">Permanent</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-gray-100 text-[10.5px] leading-relaxed animate-in fade-in duration-150">
                      <h4 className="text-[11px] font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                        <Scale size={13} className="text-emerald-500" /> Wettelijke Grondslagen
                      </h4>
                      <p className="text-gray-500 font-medium leading-relaxed">
                        Op basis van <strong>Artikel 129 van de Belgische Wet betreffende de elektronische communicatie</strong> (en de ePrivacy Richtlijn) is voor strikt functionele cookies (die noodzakelijk zijn om de gevraagde dienst te leveren) <strong>geen voorafgaande toestemming (opt-in) vereist</strong>. 
                      </p>
                      <p className="text-gray-500 font-medium leading-relaxed mt-1">
                        Je kunt desgewenst cookies uitschakelen of verwijderen via de instellingen van je internetbrowser (zoals Chrome, Safari of Edge). Let wel op dat de inlog-functionaliteit en het opslaan van klasgegevens dan mogelijk niet meer correct werken.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="space-y-6 animate-in fade-in duration-150-delay">
                    <div className="bg-amber-50/70 text-amber-950 p-4 rounded-xl border border-amber-100 space-y-1">
                      <span className="text-[11px] font-black uppercase tracking-wide flex items-center gap-1 text-amber-850">
                        <ShieldCheck size={14} /> Beheer je toestemming per categorie
                      </span>
                      <p className="text-[10px] leading-relaxed font-semibold text-amber-700">
                        In navolging van de nieuwste Belgische Gegevensbeschermingsautoriteit (GBA) richtlijnen, kan je hieronder per specifiek cookie-type je toestemming geven of intrekken.
                      </p>
                    </div>

                    <div className="space-y-4 divide-y divide-gray-100">
                      {/* Categorie 1: Strikt noodzakelijke cookies */}
                      <div className="flex justify-between items-start gap-4 pt-1">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-black text-gray-900 uppercase tracking-wider">
                              1. Strikt Noodzakelijke Sessie-cookies
                            </span>
                            <span className="text-[8px] bg-indigo-100 text-indigo-700 font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full">
                              Altijd Actief
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 font-medium">Sleutels: <code className="font-mono text-[9px] bg-gray-50 px-1 py-0.5 rounded text-indigo-650">firebase:uid</code>, <code className="font-mono text-[9px] bg-gray-50 px-1 py-0.5 rounded text-indigo-650">is_admin</code></p>
                          <p className="text-[10.5px] text-gray-500 font-bold leading-normal">
                            Deze cookies zijn noodzakelijk om je veilig in te loggen, je identiteit te verifiëren en verbinding te maken met de beveiligde databases. Zonder deze sleutels kan de app niet werken.
                          </p>
                        </div>
                        <div className="pt-1">
                          <button
                            type="button"
                            disabled
                            className="relative inline-flex h-6 w-11 shrink-0 cursor-not-allowed rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out bg-indigo-500"
                          >
                            <span className="translate-x-5 pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out" />
                          </button>
                        </div>
                      </div>

                      {/* Categorie 2: Functionele Smartboard- & weergavevoorkeuren */}
                      <div className="flex justify-between items-start gap-4 pt-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-black text-gray-900 uppercase tracking-wider">
                              2. Scherm- & Smartboard Voorkeuren
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 font-medium">Sleutels: <code className="font-mono text-[9px] bg-gray-50 px-1 py-0.5 rounded text-indigo-650">fullscreen_pref</code></p>
                          <p className="text-[10.5px] text-gray-500 font-bold leading-normal">
                            Slaat de weergavekeuzes en vensterinstellingen van de school op (zoals de fullscreen-modus op digitale houten smartboards of een actieve hoekenweergave). Als je dit uitschakelt, moet je deze instellingen bij elk bezoek opnieuw invoeren.
                          </p>
                        </div>
                        <div className="pt-1 select-none">
                          <button
                            type="button"
                            onClick={() => setPreferenceEnabled(!preferenceEnabled)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                              preferenceEnabled ? 'bg-indigo-600' : 'bg-gray-200'
                            }`}
                          >
                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              preferenceEnabled ? 'translate-x-5' : 'translate-x-0'
                            }`} />
                          </button>
                        </div>
                      </div>

                      {/* Categorie 3: Functionele Sessiestatistieken */}
                      <div className="flex justify-between items-start gap-4 pt-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-black text-gray-900 uppercase tracking-wider">
                              3. Functionele Sessietiming & Logs
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 font-medium">Sleutels: <code className="font-mono text-[9px] bg-gray-50 px-1 py-0.5 rounded text-indigo-650">keuzebord_session_consent</code></p>
                          <p className="text-[10.5px] text-gray-500 font-bold leading-normal">
                            Gebruikt om te onthouden welke schermen je in je huidige actieve sessie hebt bezocht om zo foute dubbele keuzes te voorkomen. Het herleidt je gedrag nooit naar marketing- of adverteerprofielen.
                          </p>
                        </div>
                        <div className="pt-1 select-none">
                          <button
                            type="button"
                            onClick={() => setSessionConsentEnabled(!sessionConsentEnabled)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                              sessionConsentEnabled ? 'bg-indigo-600' : 'bg-gray-200'
                            }`}
                          >
                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              sessionConsentEnabled ? 'translate-x-5' : 'translate-x-0'
                            }`} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-between gap-3 items-center">
                <p className="text-[9px] text-gray-400 font-bold max-w-xs leading-tight">
                  Door op "Instellingen Opslaan" te drukken bewaar je je specifieke voorkeuren. Je kunt deze te allen tijde opnieuw aanpassen.
                </p>
                <div className="flex gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="px-5 py-3 bg-gray-100 font-bold uppercase text-[10px] text-gray-500 hover:bg-gray-200 transition-all rounded-xl cursor-pointer"
                  >
                    Annuleren
                  </button>
                  <button
                    onClick={handleSavePreferences}
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 font-black text-white uppercase text-[10px] tracking-wider rounded-xl shadow-md transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                  >
                    Instellingen Opslaan
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
