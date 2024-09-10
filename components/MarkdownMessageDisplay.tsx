import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Message } from '@/utils/actions'; // Assuming you have a Message type defined

const MarkdownMessageDisplay: React.FC<{ messages: Message[] }> = ({ messages }) => {
  return (
    <div className="flex flex-col space-y-4">
      {messages.map((m, index) => (
        m && m.role ? (
          <div key={index} className="flex p-4 justify-start">
            <div className={`p-2 rounded ${m.role === 'user' ? 'bg-blue-100' : 'bg-gray-100'} max-w-3xl`}>
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