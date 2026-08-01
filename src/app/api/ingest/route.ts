import { inngest } from '@/inngest/client';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const {
      text,
      courseId = 'demo-course',
      chunkingMethod = 'paragraph',
      metadata = {},
    } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'text is required' }, { status: 400 });
    }

    if (!courseId || typeof courseId !== 'string') {
      return NextResponse.json(
        { error: 'courseId is required' },
        { status: 400 }
      );
    }

    await inngest.send({
      name: 'embed/text-with-metadata',
      data: {
        text,
        courseId,
        chunkingMethod,
        metadata,
      },
    });

    return NextResponse.json({ success: true, courseId });
  } catch (error) {
    console.error('Ingest error:', error);
    return NextResponse.json(
      { error: 'Failed to queue embedding job' },
      { status: 500 }
    );
  }
}
