"use client";

import { IMessage } from "@/app/actions";
import { cn } from "@/lib/utils";
import axios from "axios";
import { Plus, Send, X } from "lucide-react";
import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { v4 as uuidv4 } from "uuid";

interface UploadingFile {
  file: File;
  progress: number;
  url?: string;
  id: string;
}

export default function Chat() {
  const [content, setContent] = useState("");
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (content == "") return;
    try {
      const anonymized_text = await axios.post(`/api/anonymize`, {
        text: content,
      });
      const userMessage = {
        content: anonymized_text.data,
        isUser: true,
      };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setContent("");

      // SEND REQUEST TO AI
      setIsLoading(true);
      const contents = await Promise.all(updatedMessages.map(async (message) => {
        const inlineParts = await Promise.all(
          uploadingFiles.map(async (uf) => ({
            inline_data: {
              mime_type: uf.file.type,
              data: Buffer.from(await uf.file.arrayBuffer()).toString("base64"),
            },
          }))
        );

        return {
        role: message.isUser ? "user" : "model",
        parts: [
          ...inlineParts,
          {text: message.content,},
        ],
      }}));
      const response = await axios.post(`/api/generate`, {
        contents: contents,
      });
      const modelMessage = {
        content: response.data,
        isUser: false,
      };
      setMessages((messages) => [...messages, modelMessage]);
      setIsLoading(false);
    } catch (e) {
      console.log(e);
    }
  };

  const handlePlusClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    const newUploadingFiles = files.map((file) => ({
      file,
      progress: 0,
      id: uuidv4(),
    }));
    setUploadingFiles((prev) => [...prev, ...newUploadingFiles]);
    for (const uploadingFile of newUploadingFiles) {
      const formData = new FormData();
      formData.append("files", uploadingFile.file);

      try {
        const { data } = await axios.post("/api/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            const progress = progressEvent.loaded / (progressEvent.total ?? 1);
            setUploadingFiles((current) =>
              current.map((uf) =>
                uf.id === uploadingFile.id ? { ...uf, progress } : uf
              )
            );
          },
        });
        setUploadingFiles((current) =>
          current.map((uf, i) =>
            uf.id === uploadingFile.id
              ? { ...uf, progress: 1, url: data.files[i] }
              : { ...uf, url: data.files[i] }
          )
        );
      } catch (error) {
        console.error("Upload error", error);
      }
    }

    e.target.value = "";
  };

  return (
    <div className="container max-w-200 relative p-5">
      <div className="min-h-screen flex flex-col gap-3">
        {messages.map((message, i) => (
          <div
            key={i}
            className={cn(
              "p-2 w-fit min-w-1/3 border rounded whitespace-break-spaces",
              message.isUser ? "ml-auto bg-card" : ""
            )}
          >
            <p>{message.content}</p>
          </div>
        ))}
      </div>
      <form
        className="z-5 pb-10 w-full bg-background p-4 sticky bottom-0 flex justify-between gap-5"
        onSubmit={handleSubmit}
      >
        <div className="p-2 col border rounded-3xl bg-card w-full">
          {/* SHOW FILES */}
          {uploadingFiles.length > 0 && (
            <div className="flex overflow-x-scroll gap-3 pb-3">
              {uploadingFiles.map((uf, i) => (
                <Link
                  target="_blank"
                  key={i}
                  href={uf.url || ""}
                  className="border rounded-2xl p-3 bg-card w-48 flex flex-col group"
                >
                  <div className="flex justify-between items-center h-8">
                    <p className="truncate font-semibold">{uf.file.name}</p>
                    <button
                      type="button"
                      className="rounded-full bg-transparent hover:bg-accent group-hover:block hidden p-2"
                      onClick={() =>
                        setUploadingFiles((prev) =>
                          prev.filter((f) => f.id != uf.id)
                        )
                      }
                    >
                      <X className="stroke-card-foreground size-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600">
                    {(uf.file.size / 1024).toFixed(2)} KB
                  </p>
                  <p className="text-sm text-gray-600">
                    {(uf.progress * 100).toFixed(2)}
                  </p>
                </Link>
              ))}
            </div>
          )}
          {/* END OF FILE SHOW */}

          <TextareaAutosize
            className="w-full m-3"
            placeholder="Enter your prompt..."
            maxRows={10}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="flex justify-between">
            <button
              type="button"
              className="rounded-full"
              onClick={handlePlusClick}
            >
              <Plus className="size-5" />
            </button>
            <button
              type="submit"
              className={cn("rounded-full", isLoading ? "bg-muted" : "")}
              disabled={isLoading}
            >
              <Send className="size-5" />
            </button>
          </div>
          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </form>
    </div>
  );
}
