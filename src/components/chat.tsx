'use client';

import { IMessage } from '@/app/actions';
import { cn } from '@/lib/utils';
import { Send } from 'lucide-react';
import { FormEvent, useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';

export default function Chat() {
    const [content, setContent] = useState("");
    const [messages, setMessages] = useState<IMessage[]>([]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        const newMessage = {
            content: content,
            isUser: true
        }
        setMessages(messages => [...messages, newMessage]);
    };

    return (
        <div className='container max-w-200 relative'>
            <div className='h-screen flex flex-col gap-3'>
            {messages.map((message, i) => (
                <div key={i} className={cn("p-2 w-fit min-w-1/3 border rounded whitespace-break-spaces", message.isUser && "ml-auto")}>
                <p>{message.content}</p>
                </div>
            ))}
            </div>
            <form className='z-5 pb-10 w-full bg-background p-5 absolute bottom-0 flex justify-between gap-5' onSubmit={handleSubmit}>
                <div className='p-2 border rounded w-full'>
                <TextareaAutosize className='w-full' minRows={2} maxRows={20} onChange={(e) => setContent(e.target.value)} />
                </div>
                <button type="submit" className='size-fit'><Send /></button>
            </form>
        </div>
    );
}