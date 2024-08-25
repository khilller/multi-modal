'use client';

import { useState, useRef, useEffect } from 'react';
import { readStreamableValue } from 'ai/rsc';
import { Message, continueConversation } from '@/utils/actions';

export const maxDuration = 60;

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
    
    const userMessage: Message = { role: 'user', content: input };
    setConversation(prev => [...prev, userMessage]);
    setUIConversation(prev => [...prev, userMessage]);
    setInput('');

    const { messages, newMessage, display } = await continueConversation([
      ...conversation.map(({ role, content }) => ({ role, content })),
      { role: 'user', content: input },
    ]);

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