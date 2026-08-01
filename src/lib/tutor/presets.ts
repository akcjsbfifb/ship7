export type TutorPreset = {
  key: string;
  label: string;
  description: string;
  prompt: string;
};

/** Fixed presets (not stored in DB). Order is the injection order into the system prompt. */
export const TUTOR_PRESETS: TutorPreset[] = [
  {
    key: 'no_answers',
    label: 'No dar soluciones finales',
    description: 'Guiar con pistas; no resolver ejercicios completos.',
    prompt:
      'Do not give the final solution to exercises or homework. Guide the student with hints, questions, and partial steps so they can reach the answer themselves.',
  },
  {
    key: 'socratic',
    label: 'Método socrático',
    description: 'Preferir preguntas y pasos parciales.',
    prompt:
      'Prefer a Socratic style: ask clarifying questions and offer partial steps rather than long complete explanations when the student is working through a problem.',
  },
  {
    key: 'course_only',
    label: 'Solo material del curso',
    description: 'No inventar contenido fuera del contexto del curso.',
    prompt:
      'Only use the provided course materials and context. If something is not covered, say so clearly instead of inventing facts outside the course.',
  },
  {
    key: 'no_exam_leak',
    label: 'No filtrar evaluaciones',
    description: 'Si parece un examen, no revelar claves ni respuestas completas.',
    prompt:
      'If the request looks like an exam, quiz, or graded assessment, do not reveal answer keys or complete graded solutions. Offer study guidance only.',
  },
];

export const TUTOR_PRESET_KEYS = TUTOR_PRESETS.map((p) => p.key);

export const TUTOR_PRESET_MAP = Object.fromEntries(
  TUTOR_PRESETS.map((p) => [p.key, p]),
) as Record<string, TutorPreset>;

export function filterValidPresetKeys(keys: unknown): string[] {
  if (!Array.isArray(keys)) return [];
  const allowed = new Set(TUTOR_PRESET_KEYS);
  const seen = new Set<string>();
  const result: string[] = [];
  for (const key of keys) {
    if (typeof key !== 'string' || !allowed.has(key) || seen.has(key)) continue;
    seen.add(key);
    result.push(key);
  }
  return result;
}

/** Presets in fixed declaration order among the active keys. */
export function orderedActivePresets(keys: string[]): TutorPreset[] {
  const active = new Set(keys);
  return TUTOR_PRESETS.filter((p) => active.has(p.key));
}
