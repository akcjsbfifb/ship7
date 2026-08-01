import { streamText, StreamData } from 'ai';
import { searchSimilarChunks } from '@/lib/actions/search';
import { chatModel } from '@/lib/ai';

import { AuthError } from '@/lib/auth/errors';
import { handleError } from '@/lib/auth/http';
import { requireCourseAccess } from '@/lib/auth/require-course-access';
import { requireUser } from '@/lib/auth/require-user';
import { prisma } from '@/lib/db/client';
import { buildTutorSystemPrompt } from '@/lib/tutor/build-system-prompt';

export const maxDuration = 30;

type SearchRow = {
  content?: string;
  distance: number;
  createdAt?: string | Date;
  metadata?: Record<string, unknown>;
  courseId?: string;
};

export async function POST(req: Request) {
  try {
    const { user } = await requireUser(req);

    const { messages, courseId, threadId } = await req.json();

    if (!courseId || typeof courseId !== 'string') {
      return handleError(new AuthError('courseId is required', 400));
    }
    if (!threadId || typeof threadId !== 'string') {
      return handleError(new AuthError('threadId is required', 400));
    }

    const course = await requireCourseAccess(user, courseId);

    const thread = await prisma.chatThread.findFirst({
      where: { id: threadId, courseId, userId: user.id },
    });
    if (!thread) {
      return handleError(new AuthError('Thread not found', 404));
    }

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage?.content) {
      return handleError(new AuthError('message content is required', 400));
    }

    const systemPrompt = buildTutorSystemPrompt(course);
    const userText = String(lastMessage.content);

    await prisma.chatMessage.create({
      data: {
        threadId: thread.id,
        role: 'user',
        content: userText,
      },
    });

    // Auto-title from first user message
    if (!thread.title) {
      await prisma.chatThread.update({
        where: { id: thread.id },
        data: { title: userText.slice(0, 80) },
      });
    }

    const data = new StreamData();

    const searchResults = (await searchSimilarChunks(
      userText,
      courseId,
      8,
    )) as SearchRow[];

    const contextDetails = searchResults?.length
      ? searchResults.map((r) => ({
          content: r.content ?? null,
          metadata: {
            distance: Number(r.distance).toFixed(3),
            createdAt: r.createdAt
              ? new Date(r.createdAt).toLocaleDateString()
              : null,
            courseId: r.courseId ?? courseId,
            chunkingMethod:
              typeof r.metadata?.chunkingMethod === 'string'
                ? r.metadata.chunkingMethod
                : null,
            chunkIndex:
              typeof r.metadata?.chunkIndex === 'number'
                ? r.metadata.chunkIndex
                : null,
            totalChunks:
              typeof r.metadata?.totalChunks === 'number'
                ? r.metadata.totalChunks
                : null,
          },
        }))
      : [];

    data.append({ contextDetails });

    const context = contextDetails.length
      ? `Relevant context (course ${courseId}):\n${contextDetails
          .map(
            (r) =>
              `${r.content}\n(Distance: ${r.metadata.distance}, Created: ${r.metadata.createdAt}, Method: ${r.metadata.chunkingMethod}, Index: ${r.metadata.chunkIndex}/${r.metadata.totalChunks})`,
          )
          .join('\n\n')}\n\n`
      : '';

    const result = await streamText({
      model: chatModel,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...(context
          ? [
              {
                role: 'system' as const,
                content: context,
              },
            ]
          : []),
        ...messages,
      ],
      onFinish: async ({ text }) => {
        try {
          if (text?.trim()) {
            await prisma.chatMessage.create({
              data: {
                threadId: thread.id,
                role: 'assistant',
                content: text,
              },
            });
            await prisma.chatThread.update({
              where: { id: thread.id },
              data: { updatedAt: new Date() },
            });
          }
        } catch (err) {
          console.error('Failed to persist assistant message', err);
        }
        data.close();
      },
    });

    return result.toDataStreamResponse({ data });
  } catch (error) {
    return handleError(error);
  }
}
