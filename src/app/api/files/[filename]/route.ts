
import { readFile } from 'fs/promises';
import mime from 'mime-types';
import { NextRequest } from 'next/server';
import path from 'path';

export async function GET(req: NextRequest, { params }: { params: { filename: string } }) { // eslint-disable-line no-use-before-define
  const filePath = path.join('/tmp', params.filename);
  const contentType = mime.lookup(filePath) || 'application/octet-stream';
  try {
    const file = await readFile(filePath);
    return new Response(file, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-store',
        'Content-Disposition': 'inline',
      },
    });
  } catch (e) {
    console.log("Error: " + e);
    return new Response('File not found', { status: 404 });
  }
}
