import { orderedActivePresets } from '@/lib/tutor/presets';

export const EDUAI_BASE_SYSTEM_PROMPT =
  'You are EduAI, a helpful educational assistant for students. Use the provided course context to answer questions when available. Always start your response with a brief mention of which context you used, if any. Stay within the course material.';

export type TutorCoursePromptFields = {
  title?: string | null;
  tutorInstructions?: string | null;
  tutorPresetKeys?: string[];
};

/**
 * 1. Base EduAI
 * 2. Course title (orientation)
 * 3. Active presets (fixed order)
 * 4. Teacher free-text instructions (if any)
 */
export function buildTutorSystemPrompt(course: TutorCoursePromptFields): string {
  const parts: string[] = [EDUAI_BASE_SYSTEM_PROMPT];

  const title = course.title?.trim();
  if (title) {
    parts.push(
      `You are tutoring the course "${title}". Prefer answering from the retrieved course context below when present.`,
    );
  }

  const presets = orderedActivePresets(course.tutorPresetKeys ?? []);
  for (const preset of presets) {
    parts.push(preset.prompt);
  }

  const instructions = course.tutorInstructions?.trim();
  if (instructions) {
    parts.push(
      `Additional instructions from the course teacher:\n${instructions}`,
    );
  }

  return parts.join('\n\n');
}
