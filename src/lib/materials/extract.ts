import { execFile } from 'child_process';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join, extname } from 'path';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

function isPlainText(filename: string, mimeType: string) {
  const ext = extname(filename).toLowerCase();
  return (
    mimeType.startsWith('text/') ||
    ext === '.txt' ||
    ext === '.md' ||
    ext === '.markdown' ||
    ext === '.csv'
  );
}

/**
 * Convert uploaded file bytes to markdown/text for RAG indexing.
 * Prefers `markitdown` CLI when available; plain text files are read directly.
 */
export async function extractTextFromFile(opts: {
  buffer: Buffer;
  filename: string;
  mimeType: string;
}): Promise<string> {
  const { buffer, filename, mimeType } = opts;

  if (isPlainText(filename, mimeType)) {
    return buffer.toString('utf8').trim();
  }

  const dir = mkdtempSync(join(tmpdir(), 'eduai-md-'));
  const inputPath = join(dir, filename.replace(/[^a-zA-Z0-9._-]/g, '_'));
  const outputPath = join(dir, 'out.md');

  try {
    writeFileSync(inputPath, buffer);

    try {
      await execFileAsync(
        'markitdown',
        [inputPath, '-o', outputPath],
        { timeout: 55_000, maxBuffer: 20 * 1024 * 1024 },
      );
      const md = readFileSync(outputPath, 'utf8').trim();
      if (md) return md;
    } catch (err) {
      // Fallback: try python -m markitdown
      try {
        await execFileAsync(
          'python3',
          ['-m', 'markitdown', inputPath, '-o', outputPath],
          { timeout: 55_000, maxBuffer: 20 * 1024 * 1024 },
        );
        const md = readFileSync(outputPath, 'utf8').trim();
        if (md) return md;
      } catch {
        const message = err instanceof Error ? err.message : String(err);
        throw new Error(
          `No se pudo convertir el archivo con markitdown. ${message.slice(0, 200)}`,
        );
      }
    }

    throw new Error('markitdown devolvió texto vacío');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
