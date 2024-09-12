import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Message } from '@/utils/actions'; // Assuming you have a Message type defined
import { User, Bot } from 'lucide-react'; // Importing icons from lucide-react

const MarkdownMessageDisplay: React.FC<{ messages: Message[] }> = ({ messages }) => {
  return (
    <div className="flex flex-col space-y-4">
      {messages.map((m, index) => (
        m && m.role ? (
          <div key={index} className="flex p-4 items-start">
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
              m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
            }`}>
              {m.role === 'user' ? (
                <User className="h-5 w-5" />
              ) : (
                <Bot className="h-5 w-5" />
              )}
            </div>
            <div className={`p-2 rounded  ${
              m.role === 'user' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-secondary text-secondary-foreground'
            } max-w-3xl`}>
              <ReactMarkdown>
                {m.content}
              </ReactMarkdown>
            </div>
          </div>
        ) : null
      ))}
    </div>
  );
};

export default MarkdownMessageDisplay;