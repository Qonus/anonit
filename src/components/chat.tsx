"use client";

import { IMessage, IUploadingFile } from "@/app/actions";
import { cn } from "@/lib/utils";
import axios from "axios";
import { Plus, Send, X } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { v4 as uuidv4 } from "uuid";

export default function Chat() {
  const [content, setContent] = useState("");
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<IUploadingFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

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
        files: uploadingFiles
      };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setContent("");
      setUploadingFiles([]);

      // SEND REQUEST TO AI
      setIsLoading(true);
      const contents = await Promise.all(updatedMessages.map(async (message) => {
        const inlineParts = await Promise.all(
          message.files.map(async (uf) => ({
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
      console.log(contents);
      const response = await axios.post(`/api/generate`, {
        contents: contents,
      });
      const modelMessage = {
        content: response.data,
        isUser: false,
        files: []
      };
      setMessages((messages) => [...messages, modelMessage]);
    } catch (e) {
      console.log(e);
    }
    setIsLoading(false);
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

    const newFiles = [...uploadingFiles]
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
        const getFile = (base64: string, filename: string, media_type: string) => {
          const byteCharacters = atob(base64);
          const byteNumbers = new Array(byteCharacters.length).fill(0).map((_, i) => byteCharacters.charCodeAt(i));
          const byteArray = new Uint8Array(byteNumbers);
          return new File([byteArray], filename, { type: media_type });
        }
        newFiles.push({
          ...uploadingFile,
          url: data.files[0].url,
          file: getFile(data.files[0].base64,uploadingFile.file.name,data.files[0].media_type)
        });
      } catch (error) {
        console.error("Upload error", error);
      }
    }
    setUploadingFiles(newFiles)
    e.target.value = "";
  };

  return (
    <div className="container max-w-200 relative h-120">
      <div className="flex flex-col p-4 gap-3 h-full overflow-y-scroll" ref={containerRef}>
        {messages.map((message, i) => (
          <div
            key={i}
            className={cn(
              "p-3 w-fit max-w-full min-w-1/3 border rounded-xl whitespace-break-spaces",
              message.isUser ? "ml-auto bg-card" : ""
            )}
          >
            {message.files.length != 0 &&
            <div className="flex overflow-x-scroll gap-3 pb-3">
            {message.files.map((uf, i) => (
              <div
              onClick={() => window.open(uf.url || "", "_blank")}
              key={i}
              className="hover:bg-accent cursor-pointer transition border rounded-2xl p-3 bg-card w-20 flex flex-col group"
            >
              <p className="truncate font-semibold">{uf.file.name}</p>
            </div>
            ))}
            </div>}
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
                <div
                  onClick={() => window.open(uf.url || "", "_blank")}
                  key={i}
                  className="border rounded-2xl p-3 bg-card w-48 flex flex-col group"
                >
                  <div className="flex justify-between items-center h-8">
                    <p className="truncate font-semibold">{uf.file.name}</p>
                    <button
                      type="button"
                      className="rounded-full bg-transparent hover:bg-accent group-hover:block hidden p-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUploadingFiles((prev) =>
                          prev.filter((f) => f.id != uf.id)
                        );
                      }}>
                      <X className="stroke-card-foreground size-4" />
                    </button>
                  </div>
                  <p className="text-sm text-gray-600">
                    {(uf.file.size / 1024).toFixed(2)} KB
                  </p>
                  <p className="text-sm text-gray-600">
                    {(uf.progress * 100).toFixed(2)}
                  </p>
                </div>
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
