import { documentsVectorDB } from '@/lib/db/vector';
import { DB_CONFIG } from '@/lib/db/config';
import { NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const {
      text,
      courseId = 'demo-course',
      chunkingMethod = DB_CONFIG.chunking.defaultMethod,
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

    const result = await documentsVectorDB.addText(text, {
      courseId,
      chunkingMethod,
      metadata,
    });

    return NextResponse.json({
      success: true,
      courseId,
      chunks: result.count,
    });
  } catch (error) {
    console.error('Ingest error:', error);
    return NextResponse.json(
      { error: 'Failed to embed and store text' },
      { status: 500 }
    );
  }
}
