/**
 * Voix de robot (synthèse vocale du navigateur, aucune dépendance).
 * Les navigateurs n'autorisent la parole qu'après une première interaction (clic, touche) :
 * avant cela, speak() ne produit simplement aucun son.
 */
export const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

const KEY = 'portfolio-voice';
export const voicePref = {
  get: () => {
    try {
      return localStorage.getItem(KEY) !== '0';
    } catch {
      return true;
    }
  },
  set: (on) => {
    try {
      localStorage.setItem(KEY, on ? '1' : '0');
    } catch {}
  },
};

// voix françaises triées par genre (les voix se chargent parfois après coup)
const FEMALE = /denise|julie|hortense|amélie|amelie|aurélie|audrey|marie|céline|celine|virginie|eloise|éloïse|vivienne|brigitte|charline|coralie|jacqueline|joséphine|josephine|yvette|léa|lea|chantal|sylvie|google français|female|femme/i;
const MALE = /paul|henri|claude|thomas|jacques|rémy|remy|jérôme|jerome|antoine|alain|maurice|fabrice|jean|guillaume|daniel|nicolas|mathieu|male|homme/i;
const voices = { female: null, male: null, any: null };
const pickVoices = () => {
  const fr = window.speechSynthesis.getVoices().filter((v) => /^fr/i.test(v.lang));
  voices.any = fr[0] || null;
  voices.female = fr.find((v) => FEMALE.test(v.name) && !/(^|[^e])male/i.test(v.name)) || null;
  voices.male = fr.find((v) => MALE.test(v.name) && !FEMALE.test(v.name)) || null;
};
if (canSpeak) {
  pickVoices();
  window.speechSynthesis.addEventListener?.('voiceschanged', pickVoices);
}

/**
 * Lit un texte. gender : 'female' (voix de femme), 'male' (voix d'homme) ou 'robot'.
 * S'il n'existe qu'une voix française sur l'appareil, la hauteur fait la différence.
 */
export function speak(text, { gender = 'robot', onStart, onEnd } = {}) {
  if (!canSpeak || !text) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'fr-FR';
  const v = (gender === 'female' && voices.female) || (gender === 'male' && voices.male) || voices.any;
  if (v) u.voice = v;
  const dedicated = (gender === 'female' && voices.female) || (gender === 'male' && voices.male);
  u.pitch = gender === 'female' ? (dedicated ? 1.05 : 1.45) : gender === 'male' ? (dedicated ? 0.85 : 0.5) : 0.45;
  u.rate = gender === 'robot' ? 0.98 : 1;
  u.onstart = () => onStart?.();
  u.onend = u.onerror = () => onEnd?.();
  synth.speak(u);
}

export function stopSpeaking() {
  if (canSpeak) window.speechSynthesis.cancel();
}
