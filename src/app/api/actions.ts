"use server";

import { getApiUrl } from "@/lib/utils";
import axios from "axios";

export async function anonymizeText(text: string) {
  const { data } = await axios.post(`${getApiUrl()}/anonymize`, {
    text: text,
  });
  return data;
}

export async function anonymizeImage(buffer: Buffer<ArrayBuffer>) {
  return buffer;
}