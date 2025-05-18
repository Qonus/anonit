import { mkdir, writeFile } from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { anonymizeImage, anonymizeText } from "../actions";

export async function POST(req: Request) {
  const formData = await req.formData();
  const files = formData.getAll("files") as File[];

  const uploadDir = path.join(process.cwd(), "/tmp");
  await mkdir(uploadDir, { recursive: true });

  const savedFiles = [];

  for (const file of files) {
    const bytes = await file.arrayBuffer();
    let buffer = Buffer.from(bytes);

    const ext = file.name.split(".").pop();
    const isText = ext === "txt" || file.type.startsWith("text/");
    const isImage = file.type.startsWith("image/");
    
    if (isText) {
      buffer = Buffer.from(await anonymizeText(buffer.toString("utf-8")), "utf-8");
    } else if (isImage) {
      buffer = await anonymizeImage(buffer);
    }
    
    const filename = `${uuidv4()}.${ext}`;
    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);
    savedFiles.push({url: `api/files/${filename}`, base64: buffer.toString("base64"), media_type: isImage ? "image/jpeg" : "text/plain"});
  }

  return NextResponse.json({ files: savedFiles });
}
