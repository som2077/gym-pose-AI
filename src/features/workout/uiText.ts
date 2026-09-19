import type { ExerciseId } from "../exercises/types";
import type { CoachLanguage } from "./coachText";

type WorkoutUiCopy = {
  liveCoach: string; sideView: string; frontView: string; backToSetup: string;
  paused: string; getReady: string; trackingLive: string; bodyInFrame: string; findingPosition: string;
  pauseTitle: string; pauseCopy: string; countdownCopy: string; cameraPaused: string; slowControl: string;
  totalReps: string; cleanReps: string; cleanRate: string; finish: string; finishing: string;
  resume: string; pause: string; startWorkout: string; waiting: string; privacy: string;
  pausedFeedback: string; jointsFeedback: string; positionReady: string; steadyPace: string;
  pushupHint: string; sideHint: string; frontHint: string;
  back: string; cameraSetup: string; setupSuffix: string; setupSubtitle: string;
  phonePlacement: string; privacyFirst: string; setupPrivacy: string; startCalibration: string;
  sessionComplete: string; doneSuffix: string; consistency: string; cleanFormScore: string;
  cleanOutOf: (clean: number, total: number) => string; mostFrequentNote: string; noErrors: string;
  trainAgain: string; home: string;
};

const english: WorkoutUiCopy = {
  liveCoach: "YOUR LIVE COACH", sideView: "SIDE VIEW", frontView: "FRONT VIEW", backToSetup: "Back to camera setup",
  paused: "PAUSED", getReady: "GET READY", trackingLive: "TRACKING LIVE", bodyInFrame: "BODY IN FRAME", findingPosition: "FINDING POSITION",
  pauseTitle: "Take a breath.", pauseCopy: "Resume when you're ready.", countdownCopy: "Position ready · Get set", cameraPaused: "Camera paused", slowControl: "Keep your movement slow and controlled",
  totalReps: "TOTAL REPS", cleanReps: "CLEAN REPS", cleanRate: "CLEAN RATE", finish: "Finish", finishing: "Finishing…",
  resume: "Resume", pause: "Pause", startWorkout: "Start workout", waiting: "Get into position — the 3–2–1 countdown starts when your body is tracked.", privacy: "ON-DEVICE TRACKING · VIDEO STAYS PRIVATE",
  pausedFeedback: "Workout paused. Tap Resume when you are ready.", jointsFeedback: "Show the joints clearly. Use good lighting and keep the phone steady.", positionReady: "Position ready. Let’s begin.", steadyPace: "Keep a steady pace. Control every rep.",
  pushupHint: "Side view · Plank position · Keep your hands and feet in frame", sideHint: "Stand side-on · Keep your body in frame", frontHint: "Face the camera · Keep both arms visible",
  back: "← Back", cameraSetup: "CAMERA SETUP", setupSuffix: "setup", setupSubtitle: "Phone placement is important for reliable coaching.", phonePlacement: "Phone placement", privacyFirst: "Privacy first", setupPrivacy: "Live camera frames are analysed on this device. The app does not upload workout video.", startCalibration: "Start calibration",
  sessionComplete: "SESSION COMPLETE", doneSuffix: "done.", consistency: "Consistency matters. Aim for one more clean rep next session.", cleanFormScore: "CLEAN FORM SCORE", cleanOutOf: (clean, total) => `${clean} clean reps out of ${total}`, mostFrequentNote: "MOST FREQUENT NOTE", noErrors: "No high-confidence errors logged", trainAgain: "Train again", home: "Home",
};

const hindi: WorkoutUiCopy = {
  ...english,
  pausedFeedback: "Workout paused hai. Resume karke continue karo.", jointsFeedback: "Joints clearly dikhao. Achhi light aur steady phone rakho.", positionReady: "Position ready hai. Let’s begin.", steadyPace: "Steady pace rakho. Har rep control ke saath.",
  pushupHint: "Side view · Plank position · Haath aur pair frame mein", sideHint: "Side mein khade ho · Body frame mein rakho", frontHint: "Saamne khade ho · Dono arms visible rakho", waiting: "Position lo — body track hote hi 3–2–1 countdown shuru hoga.", setupSubtitle: "Reliable coaching ke liye phone placement important hai.", setupPrivacy: "Live camera frames is device par analyse honge. App workout video upload nahi karta.", consistency: "Consistency matters. Agli session mein ek aur clean rep aim karo.",
};

const spanish: WorkoutUiCopy = {
  liveCoach: "TU ENTRENADOR EN VIVO", sideView: "VISTA LATERAL", frontView: "VISTA FRONTAL", backToSetup: "Volver a la configuración de cámara",
  paused: "EN PAUSA", getReady: "PREPÁRATE", trackingLive: "SEGUIMIENTO ACTIVO", bodyInFrame: "CUERPO ENCUADRADO", findingPosition: "BUSCANDO POSICIÓN",
  pauseTitle: "Toma aire.", pauseCopy: "Reanuda cuando estés listo.", countdownCopy: "Posición lista · Prepárate", cameraPaused: "Cámara en pausa", slowControl: "Muévete despacio y con control",
  totalReps: "REPETICIONES", cleanReps: "REPETICIONES LIMPIAS", cleanRate: "TASA LIMPIA", finish: "Terminar", finishing: "Terminando…",
  resume: "Reanudar", pause: "Pausar", startWorkout: "Empezar entrenamiento", waiting: "Ponte en posición: la cuenta atrás 3–2–1 empezará cuando se detecte tu cuerpo.", privacy: "SEGUIMIENTO EN EL DISPOSITIVO · EL VIDEO ES PRIVADO",
  pausedFeedback: "Entrenamiento en pausa. Pulsa Reanudar cuando estés listo.", jointsFeedback: "Muestra bien las articulaciones. Usa buena luz y mantén el teléfono estable.", positionReady: "Posición lista. Empecemos.", steadyPace: "Mantén un ritmo constante. Controla cada repetición.",
  pushupHint: "Vista lateral · Posición de plancha · Mantén manos y pies en el encuadre", sideHint: "Ponte de lado · Mantén el cuerpo en el encuadre", frontHint: "Mira a la cámara · Mantén visibles ambos brazos",
  back: "← Volver", cameraSetup: "CONFIGURACIÓN DE CÁMARA", setupSuffix: "configuración", setupSubtitle: "La colocación del teléfono es importante para un entrenamiento fiable.", phonePlacement: "Colocación del teléfono", privacyFirst: "Privacidad primero", setupPrivacy: "Los fotogramas en vivo se analizan en este dispositivo. La aplicación no sube videos de entrenamiento.", startCalibration: "Iniciar calibración",
  sessionComplete: "SESIÓN COMPLETADA", doneSuffix: "completado.", consistency: "La constancia importa. Intenta una repetición limpia más en tu próxima sesión.", cleanFormScore: "PUNTUACIÓN DE TÉCNICA", cleanOutOf: (clean, total) => `${clean} repeticiones limpias de ${total}`, mostFrequentNote: "NOTA MÁS FRECUENTE", noErrors: "No hay errores detectados con alta confianza", trainAgain: "Entrenar otra vez", home: "Inicio",
};

export function workoutUiText(language: CoachLanguage): WorkoutUiCopy {
  return language === "es" ? spanish : language === "hi" ? hindi : english;
}

export function localizedExerciseName(exerciseId: ExerciseId, language: CoachLanguage, name: string): string {
  if (language !== "es") return name;
  return exerciseId === "squat-side" ? "Sentadilla" : exerciseId === "pushup-side" ? "Flexiones" : "Curl de bíceps";
}

export function localizedFeedback(message: string, language: CoachLanguage, ruleName?: string): string {
  if (language !== "es") return message;
  if (ruleName === "kneesCaving") return "Mantén las rodillas alineadas con los pies.";
  if (ruleName === "leaningForward") return "Mantén el torso erguido.";
  if (ruleName === "elbowFlare") return "Mantén los codos junto al cuerpo.";
  if (ruleName === "swinging") return "Evita balancearte. Muévete con control.";
  if (message === "kneesCaving") return "Mantén las rodillas alineadas con los pies.";
  if (message === "leaningForward") return "Mantén el torso erguido.";
  if (message === "elbowFlare") return "Mantén los codos junto al cuerpo.";
  if (message === "swinging") return "Evita balancearte. Muévete con control.";
  const known: Record<string, string> = {
    "Side se shoulder, elbow, haath aur hip dikhao. Plank position lo.": "Muestra el hombro, el codo, la mano y la cadera de lado. Ponte en posición de plancha.",
    "Arm track ho rahi hai. Reps count hongi; body line ke liye hip aur pair bhi frame mein rakho.": "Se está siguiendo el brazo. Se contarán repeticiones; para revisar la línea corporal, mantén también la cadera y los pies en el encuadre.",
    "Arm tracked. Neeche jao, phir elbows seedhe karke upar aao.": "Brazo detectado. Baja y vuelve a subir estirando los codos.",
    "Hip ko shoulder aur ankle ki line mein rakho.": "Mantén la cadera alineada con los hombros y los tobillos.",
    "Body frame se bahar hai. Poora body camera mein lao.": "El cuerpo está fuera del encuadre. Vuelve a colocarlo completo en la cámara.",
    "Camera angle aur full body framing check karo.": "Comprueba el ángulo de la cámara y el encuadre de todo el cuerpo.",
    "Pose detector start ho raha hai…": "El detector de postura se está iniciando…",
    "Pose detector start nahi hua. App ko rebuild karke phir try karo.": "El detector de postura no se inició. Vuelve a abrir la aplicación e inténtalo otra vez.",
  };
  return known[message] ?? message;
}
