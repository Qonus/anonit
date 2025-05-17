"use client";

import { IMessage } from "@/app/actions";
import { cn } from "@/lib/utils";
import axios from "axios";
import { Plus, Send } from "lucide-react";
import { FormEvent, useState } from "react";
import TextareaAutosize from "react-textarea-autosize";

export default function Chat() {
  const [content, setContent] = useState("");
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const anonymized_text = await axios.post(`/api/analyze`, {
        text: content,
      });
      const userMessage = {
        content: anonymized_text.data,
        isUser: true,
      };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setContent("");

      setIsLoading(true);
      const response = await axios.post(`/api/generate`, {
        contents: updatedMessages.map((message) => ({
          role: message.isUser ? "user" : "model",
          parts: [
            {
              text: message.content,
            },
          ],
        })),
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

  return (
    <div className="container max-w-200 relative p-5">
      <div className="min-h-screen flex flex-col gap-3">
        {messages.map((message, i) => (
          <div
            key={i}
            className={cn(
              "p-2 w-fit min-w-1/3 border rounded whitespace-break-spaces",
              message.isUser ? "ml-auto" : "bg-card"
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
          <TextareaAutosize
            className="w-full m-3"
            placeholder="Enter your prompt..."
            maxRows={10}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="flex justify-between">
            <button type="button" className="rounded-full">
              <Plus className="size-5" />
            </button>
            <button type="submit" className="rounded-full">
              <Send className="size-5" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
