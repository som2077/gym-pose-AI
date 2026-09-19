import type { ExerciseId } from "../exercises/types";

export const COACH_LANGUAGES = ["hi", "en", "es"] as const;
export type CoachLanguage = (typeof COACH_LANGUAGES)[number];
export const coachLanguages: Record<CoachLanguage, { label: string; locale: string }> = {
  hi: { label: "हिन्दी", locale: "hi-IN" },
  en: { label: "English", locale: "en-US" },
  es: { label: "Español", locale: "es-ES" },
};
export function isCoachLanguage(value: unknown): value is CoachLanguage {
  return COACH_LANGUAGES.some((language) => language === value);
}
type Translation = Record<CoachLanguage, string>;
export const coachText = {
  ready: {
    hi: "पोज़िशन तैयार है। स्टार्ट दबाएँ।",
    en: "Position ready. Tap Start when you are ready.",
    es: "Posición lista. Pulsa Empezar entrenamiento cuando quieras comenzar.",
  },
  waiting: {
    hi: "पोज़िशन लें। शरीर दिखने पर उलटी गिनती शुरू होगी।",
    en: "Get into position. The countdown starts when you are in view.",
    es: "Ponte en posición. La cuenta atrás empezará cuando la cámara te detecte.",
  },
  lost: {
    hi: "ट्रैकिंग रुक गई। शरीर फिर से कैमरे में दिखाएँ।",
    en: "Tracking lost. Bring your body back into view.",
    es: "Se ha perdido el seguimiento. Vuelve a colocar el cuerpo dentro del encuadre.",
  },
  regained: {
    hi: "ट्रैकिंग वापस आ गई। जारी रखें।",
    en: "Tracking restored. You can continue.",
    es: "Seguimiento recuperado. Puedes continuar.",
  },
  paused: {
    hi: "वर्कआउट रुका है। तैयार होने पर रिज़्यूम दबाएँ।",
    en: "Workout paused. Tap Resume when you are ready.",
    es: "Entrenamiento en pausa. Pulsa Reanudar cuando quieras continuar.",
  },
  go: { hi: "शुरू करें।", en: "Begin.", es: "¡Empieza!" },
  body: {
    hi: "ज़रूरी जोड़ साफ़ नहीं दिख रहे। कैमरे में शरीर दिखाएँ।",
    en: "The required joints are not clear. Bring your body into view.",
    es: "No se ven bien las articulaciones necesarias. Coloca el cuerpo dentro del encuadre.",
  },
  shoulder: {
    hi: "कंधा साफ़ नहीं दिख रहा। उसे कैमरे में दिखाएँ।",
    en: "Your shoulder is not clear. Bring it into view.",
    es: "No se ve bien el hombro. Colócalo dentro del encuadre.",
  },
  elbow: {
    hi: "कोहनी साफ़ नहीं दिख रही। उसे कैमरे में दिखाएँ।",
    en: "Your elbow is not clear. Bring it into view.",
    es: "No se ve bien el codo. Colócalo dentro del encuadre.",
  },
  wrist: {
    hi: "कलाई साफ़ नहीं दिख रही। हाथ कैमरे में दिखाएँ।",
    en: "Your wrist is not clear. Bring your hand into view.",
    es: "No se ve bien la muñeca. Coloca la mano dentro del encuadre.",
  },
  hip: {
    hi: "कूल्हा साफ़ नहीं दिख रहा। उसे कैमरे में दिखाएँ।",
    en: "Your hip is not clear. Bring it into view.",
    es: "No se ve bien la cadera. Colócala dentro del encuadre.",
  },
  knee: {
    hi: "घुटना साफ़ नहीं दिख रहा। उसे कैमरे में दिखाएँ।",
    en: "Your knee is not clear. Bring it into view.",
    es: "No se ve bien la rodilla. Colócala dentro del encuadre.",
  },
  ankle: {
    hi: "टखना साफ़ नहीं दिख रहा। पैर कैमरे में दिखाएँ।",
    en: "Your ankle is not clear. Bring your feet into view.",
    es: "No se ve bien el tobillo. Coloca los pies dentro del encuadre.",
  },
  position: {
    hi: "कैमरे का एंगल और शुरुआती पोज़िशन चेक करें।",
    en: "Check the camera angle and your starting position.",
    es: "Comprueba el ángulo de la cámara y tu posición inicial.",
  },
  bodyLine: {
    hi: "कूल्हे को कंधे और टखने की सीध में रखें।",
    en: "Keep your hips in line with your shoulders and ankles.",
    es: "Mantén la cadera alineada con los hombros y los tobillos.",
  },
  torso: { hi: "धड़ सीधा रखें।", en: "Keep your torso upright.", es: "Mantén el torso erguido." },
  elbows: {
    hi: "कोहनियाँ शरीर के पास स्थिर रखें।",
    en: "Keep your elbows steady at your sides.",
    es: "Mantén los codos quietos junto al cuerpo.",
  },
  control: {
    hi: "झटका न दें। धीरे और कंट्रोल के साथ करें।",
    en: "Avoid swinging. Move slowly with control.",
    es: "Evita balancearte. Muévete despacio y con control.",
  },
} satisfies Record<string, Translation>;
export type CoachHint =
  | "body"
  | "shoulder"
  | "elbow"
  | "wrist"
  | "hip"
  | "knee"
  | "ankle"
  | "position"
  | "bodyLine";

export const exerciseCoach: Record<
  ExerciseId,
  {
    setup: Translation;
    movement: Translation;
    up: Translation;
    down: Translation;
  }
> = {
  "squat-side": {
    setup: {
      hi: "स्क्वाट। फ़ोन शरीर के साइड में, कूल्हे की ऊँचाई पर स्थिर रखें। कंधे से टखने तक शरीर दिखाएँ।",
      en: "Squat. Place the phone steadily at your side, at hip height. Keep shoulders through ankles in view.",
      es: "Sentadilla. Coloca el teléfono a un lado, estable y a la altura de la cadera. Mantén el cuerpo visible desde los hombros hasta los tobillos.",
    },
    movement: {
      hi: "धीरे नीचे बैठें, फिर खड़े हों। आरामदायक सीमा में करें।",
      en: "Lower slowly, then stand up. Stay within a comfortable range.",
      es: "Baja despacio y vuelve a levantarte. Muévete dentro de un rango cómodo.",
    },
    up: { hi: "अब धीरे नीचे बैठें।", en: "Now lower slowly.", es: "Ahora baja despacio." },
    down: {
      hi: "अब कंट्रोल के साथ खड़े हों।",
      en: "Now stand up with control.",
      es: "Ahora levántate con control.",
    },
  },
  "pushup-side": {
    setup: {
      hi: "पुश अप। फ़ोन शरीर के साइड में, फ़र्श के पास स्थिर रखें। कंधा, कोहनी, कलाई, कूल्हा और पैर दिखाएँ। प्लैंक पोज़िशन लें।",
      en: "Push-up. Place the phone steadily at your side near the floor. Show your shoulder, elbow, wrist, hips and feet. Get into a plank position.",
      es: "Flexiones. Coloca el teléfono a un lado, estable y cerca del suelo. Deja visibles el hombro, el codo, la muñeca, la cadera y los pies. Ponte en posición de plancha.",
    },
    movement: {
      hi: "कोहनियाँ मोड़कर धीरे नीचे जाएँ, फिर ऊपर पुश करें।",
      en: "Bend your elbows to lower slowly, then push back up.",
      es: "Dobla los codos para bajar despacio y después empuja para volver a subir.",
    },
    up: { hi: "अब धीरे नीचे जाएँ।", en: "Now lower slowly.", es: "Ahora baja despacio." },
    down: { hi: "अब ऊपर पुश करें।", en: "Now push back up.", es: "Ahora empuja para subir." },
  },
  "bicep-curl-front": {
    setup: {
      hi: "बाइसेप कर्ल। फ़ोन सामने, छाती की ऊँचाई पर स्थिर रखें। दोनों कंधे, कोहनियाँ और कलाइयाँ दिखाएँ।",
      en: "Bicep curl. Place the phone in front at chest height. Keep both shoulders, elbows and wrists visible.",
      es: "Curl de bíceps. Coloca el teléfono delante, a la altura del pecho. Mantén visibles ambos hombros, codos y muñecas.",
    },
    movement: {
      hi: "कोहनियाँ स्थिर रखें। हाथ ऊपर कर्ल करें, फिर धीरे नीचे करें।",
      en: "Keep your elbows steady. Curl up, then lower slowly.",
      es: "Mantén los codos quietos. Flexiona los brazos hacia arriba y después bájalos despacio.",
    },
    up: { hi: "अब धीरे हाथ नीचे करें।", en: "Now lower your arms slowly.", es: "Ahora baja los brazos despacio." },
    down: { hi: "अब ऊपर कर्ल करें।", en: "Now curl up.", es: "Ahora flexiona los brazos hacia arriba." },
  },
};

export function countdownText(value: number, language: CoachLanguage): string {
  if (language === "es") return [coachText.go.es, "Uno", "Dos", "Tres"][value];
  return language === "hi"
    ? ["शुरू करें।", "एक", "दो", "तीन"][value]
    : value === 0
      ? "Begin."
      : String(value);
}
export function summaryText(
  total: number,
  clean: number,
  language: CoachLanguage,
): string {
  if (language === "es") return `Entrenamiento completado. Repeticiones registradas: ${total}. Repeticiones con buena técnica según el detector: ${clean}.`;
  return language === "hi"
    ? `वर्कआउट पूरा हुआ। ${total} रेप्स रिकॉर्ड हुए। ${clean} रेप्स की फ़ॉर्म साफ़ पहचानी गई।`
    : `Workout complete. ${total} reps recorded. ${clean} reps were rated clean by the tracker.`;
}
