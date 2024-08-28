'use client';

import { useState, useRef, useEffect } from 'react';
import { readStreamableValue } from 'ai/rsc';
import { Message, continueConversation } from '@/utils/actions';

export const maxDuration = 60;


function resizeAndConvertToBase64(file: File, maxSizeInMB: number = 1.5): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const elem = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
  
          // Calculate the width and height, constraining the proportions
          if (width > height) {
            if (width > 1024) {
              height *= 1024 / width;
              width = 1024;
            }
          } else {
            if (height > 1024) {
              width *= 1024 / height;
              height = 1024;
            }
          }
  
          elem.width = width;
          elem.height = height;
          const ctx = elem.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
  
          // Convert the image to base64 and reduce quality if necessary
          let quality = 0.9;
          let base64 = elem.toDataURL('image/jpeg', quality);
          
          while (base64.length / 1024 / 1024 > maxSizeInMB && quality > 0.1) {
            quality -= 0.1;
            base64 = elem.toDataURL('image/jpeg', quality);
          }
  
          resolve(base64);
        };
        img.onerror = error => reject(error);
      };
      reader.onerror = error => reject(error);
    });
  }

export default function Chat() {
  const [conversation, setConversation] = useState<Message[]>([]);
  const [uiConversation, setUIConversation] = useState<Message[]>([]); 
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [display, setDisplay] = useState<React.ReactNode | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    let base64Image: string | undefined;
    if (fileInputRef.current?.files?.[0]) {
        try {
          base64Image = await resizeAndConvertToBase64(fileInputRef.current.files[0], 1.5);
        } catch (error) {
          console.error('Error processing image:', error);
          // Handle the error appropriately
        }
      }
    const userMessage: Message = { role: 'user', content: input, image: base64Image || undefined };

    setConversation(prev => [...prev, userMessage]);
    setUIConversation(prev => [...prev, userMessage]);
    setInput('');

    const { messages, newMessage, display } = await continueConversation([
      ...conversation.map(({ role, content, image }) => ({ role, content, image })),
      userMessage,
    ], base64Image || undefined);

    //setConversation(messages);

    
    let assistantMessage: Message = { role: 'assistant', content: '', display};
    setConversation(prev => [...prev, assistantMessage]);
    setUIConversation(prev => [...prev, assistantMessage]);

    console.log(messages.map(({ role, content }) => ({ role, content })))

    for await (const delta of readStreamableValue(newMessage)) {
      assistantMessage.content += delta;
      setConversation(prev => [
        ...prev.slice(0, -1),
        { ...assistantMessage },
      ]);
    }

    console.log(messages.map(({ role, content }) => ({ role, content })))
    

    setIsLoading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {uiConversation.map((m, index) => (
        <div key={index} className={`whitespace-pre-wrap mb-4 ${m.role === 'user' ? 'text-blue-600' : 'text-green-600'}`}>
          <strong>{m.role === 'user' ? 'User: ' : 'AI: '}</strong>
          {m.content}
          {m.display}
          {m.image && <img src={m.image} alt="User uploaded" className="max-w-full h-32 mt-2" />}
          
        </div>
      ))}

      {isLoading && (
        <div className="text-gray-500 italic">AI is thinking...</div>
      )}

      <form
        className="fixed bottom-0 w-full max-w-md p-2 mb-8 border border-gray-300 rounded shadow-xl space-y-2"
        onSubmit={handleSubmit}
      >
        <input
          type="file"
          className="w-full"
          onChange={event => {
            // Handle file upload logic here
          }}
          multiple
          ref={fileInputRef}
        />
        <input
          className="w-full p-2 border rounded"
          value={input}
          placeholder="Say something..."
          onChange={event => setInput(event.target.value)}
          disabled={isLoading}
        />
        <button
          type="submit"
          className="w-full p-2 bg-blue-500 text-white rounded"
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Send'}
        </button>
      </form>
    </div>
  );
}