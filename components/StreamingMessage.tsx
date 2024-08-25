import React from 'react';
import { StreamableValue, useStreamableValue } from 'ai/rsc';

interface StreamingMessageProps {
  content: StreamableValue<string, any >;
}

export const StreamingMessage: React.FC<StreamingMessageProps> = ({ content }) => {
  const [value] = useStreamableValue(content);

  return (
    <div className="streaming-message">
      {value}
    </div>
  );
};