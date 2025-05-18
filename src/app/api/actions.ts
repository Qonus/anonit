"use server";

import { getApiUrl } from "@/lib/utils";
import axios from "axios";

export async function anonymizeText(text: string) {
  const { data } = await axios.post(`${getApiUrl()}/anonymize/text`, {
    text: text,
  });
  return data;
}

export async function anonymizeImage(buffer: Buffer<ArrayBuffer>) {
  const { data } = await axios.post(`${getApiUrl()}/anonymize/image`, buffer, {
    headers: {
      'Content-Type': 'application/octet-stream',
    },
    responseType: 'arraybuffer',
  });
  return data;
}