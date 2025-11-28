interface MessagingMessagesAreaProps {
  messages: any[];
  currentUser: any;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export function MessagingMessagesArea({ messages, currentUser, messagesEndRef }: MessagingMessagesAreaProps) {
  const renderMessageContent = (message: any) => {
    switch (message.message_type) {
      case 'claim_initial':
        return '👋 Hello, I believe this is my lost item';
      case 'suggestion':
        return `📍 ${message.display_text?.replace('📍 Suggested: ', '') || message.content?.replace('Suggested: ', '') || message.content}`;
      case 'confirmation':
        return `✅ ${message.display_text?.replace('✅ Confirmed: ', '') || message.content?.replace('Confirmed: ', '') || message.content}`;
      case 'system':
        // Don't show private system messages in chat
        if (message.private) return null;
        return `📢 ${message.display_text || message.content}`;
      case 'share_contact':
        return '📞 Shared contact information';
      case 'share_email':
        return `${message.display_text || message.content}`;
      default:
        return message.display_text || message.content || '💬 Message';
    }
  };

  return (
    <div className="flex-1 p-4 overflow-y-auto bg-white">
      {messages.length === 0 ? (
        <div className="text-center text-gray-700">No messages yet. Start the conversation!</div>
      ) : (
        <div className="space-y-3">
          {messages.map((message) => {
            const content = renderMessageContent(message);
            if (!content) return null; // Skip private system messages
            
            return (
              <div
                key={message.id}
                className={`p-3 rounded-lg max-w-xs ${
                  message.sender_id === currentUser.id 
                    ? 'bg-blue-100 ml-auto border border-blue-200 text-gray-900' 
                    : message.message_type === 'system'
                    ? 'bg-yellow-100 text-gray-900 border border-yellow-300 text-center'
                    : 'bg-gray-100 text-gray-900 border border-gray-200'
                }`}
              >
                <div className="text-sm whitespace-pre-line">
                  {content}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {new Date(message.created_at).toLocaleTimeString()}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
}
