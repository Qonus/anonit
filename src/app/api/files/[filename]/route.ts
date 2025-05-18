
import { readFile } from 'fs/promises';
import mime from 'mime-types';
import path from 'path';

export async function GET(req: Request, { params }: { params: { filename: string } }) { // eslint-disable-line no-use-before-define
  const filePath = path.join(process.cwd(), '/tmp', params.filename);
  const contentType = mime.lookup(filePath) || 'application/octet-stream';
  try {
    const file = await readFile(filePath);
    return new Response(file, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    console.log("Error: " + e);
    return new Response('File not found', { status: 404 });
  }
}
