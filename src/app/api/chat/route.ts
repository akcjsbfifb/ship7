import { streamText, StreamData } from 'ai';
import { searchSimilarChunks } from '@/lib/actions/search';
import { chatModel } from '@/lib/ai';

export const maxDuration = 30;

type SearchRow = {
  content?: string;
  distance: number;
  createdAt?: string | Date;
  metadata?: Record<string, unknown>;
  courseId?: string;
};

export async function POST(req: Request) {
  const { messages, courseId = 'demo-course' } = await req.json();
  const lastMessage = messages[messages.length - 1];

  const data = new StreamData();

  const searchResults = (await searchSimilarChunks(
    lastMessage.content,
    courseId
  )) as SearchRow[];

  const contextDetails = searchResults?.length
    ? searchResults.map((r) => ({
        content: r.content,
        metadata: {
          distance: Number(r.distance).toFixed(3),
          createdAt: r.createdAt
            ? new Date(r.createdAt).toLocaleDateString()
            : undefined,
          courseId: r.courseId ?? courseId,
          ...r.metadata,
        },
      }))
    : [];

  data.append({ contextDetails });

  const context = contextDetails.length
    ? `Relevant context (course ${courseId}):\n${contextDetails
        .map(
          (r) =>
            `${r.content}\n(Distance: ${r.metadata.distance}, Created: ${r.metadata.createdAt}, Method: ${r.metadata.chunkingMethod}, Index: ${r.metadata.chunkIndex}/${r.metadata.totalChunks})`
        )
        .join('\n\n')}\n\n`
    : '';

  const result = await streamText({
    model: chatModel,
    messages: [
      {
        role: 'system',
        content:
          'You are EduAI, a helpful educational assistant for students. Use the provided course context to answer questions when available. Always start your response with a brief mention of which context you used, if any. Stay within the course material.',
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
    onFinish: () => {
      data.close();
    },
  });

  return result.toDataStreamResponse({ data });
}
