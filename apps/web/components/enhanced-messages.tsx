// Enhanced Messages Page
// Apply to /apps/web/app/messages/page.tsx

import React from 'react';

export const EnhancedMessages = () => {
  const [selectedChat, setSelectedChat] = React.useState(1);
  const [message, setMessage] = React.useState('');
  const [typing, setTyping] = React.useState(false);

  const chats = [
    {
      id: 1,
      name: 'John Doe',
      avatar: 'JD',
      lastMessage: 'When can I view the property?',
      timestamp: '2 min ago',
      unread: 2,
      online: true,
      property: 'Modern 2-Bedroom Apartment',
    },
    {
      id: 2,
      name: 'Jane Smith',
      avatar: 'JS',
      lastMessage: 'Thanks for the information',
      timestamp: '1 hour ago',
      unread: 0,
      online: false,
      property: 'Luxury Villa',
    },
    {
      id: 3,
      name: 'Mike Johnson',
      avatar: 'MJ',
      lastMessage: 'Is the property still available?',
      timestamp: '3 hours ago',
      unread: 1,
      online: true,
      property: 'Studio Apartment',
    },
  ];

  const messages = [
    { id: 1, sender: 'other', text: 'Hi, I\'m interested in your property', timestamp: '10:30 AM' },
    { id: 2, sender: 'me', text: 'Great! When would you like to view it?', timestamp: '10:32 AM' },
    { id: 3, sender: 'other', text: 'When can I view the property?', timestamp: '10:35 AM' },
    { id: 4, sender: 'me', text: 'How about tomorrow at 2 PM?', timestamp: '10:36 AM' },
  ];

  const currentChat = chats.find(c => c.id === selectedChat);

  return (
    <div className="animate-fadeInUp">
      <div className="wrap py-8">
        <h1 className="page-heading mb-8 animate-slideInLeft">Messages</h1>

        <div className="inbox-shell animate-scaleIn">
          {/* Chat List */}
          <div className="border-r border-[var(--color-border)] overflow-y-auto">
            <div className="p-4 border-b border-[var(--color-border)]">
              <input
                type="text"
                placeholder="Search conversations..."
                className="input-modern w-full"
              />
            </div>

            <div className="divide-y divide-[var(--color-border)]">
              {chats.map((chat, i) => (
                <button
                  key={chat.id}
                  onClick={() => setSelectedChat(chat.id)}
                  className={`w-full p-4 text-left transition-all hover:bg-[var(--color-surface-2)] animate-slideInLeft ${
                    selectedChat === chat.id ? 'bg-[var(--color-surface-2)] border-l-4 border-[var(--color-primary)]' : ''
                  }`}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative flex-shrink-0">
                      <div className="avatar-md">{chat.avatar}</div>
                      {chat.online && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-[var(--color-success)] rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold truncate">{chat.name}</span>
                        <span className="text-xs text-[var(--color-fg-muted)] flex-shrink-0">{chat.timestamp}</span>
                      </div>
                      <p className="text-sm text-[var(--color-fg-muted)] truncate">{chat.lastMessage}</p>
                      <p className="text-xs text-[var(--color-primary)] mt-1">{chat.property}</p>
                    </div>
                    {chat.unread > 0 && (
                      <div className="badge-modern badge-primary flex-shrink-0">
                        {chat.unread}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat View */}
          <div className="flex flex-col">
            {currentChat ? (
              <>
                {/* Chat Header */}
                <div className="border-b border-[var(--color-border)] p-4 flex items-center justify-between animate-slideInRight">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="avatar-md">{currentChat.avatar}</div>
                      {currentChat.online && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-[var(--color-success)] rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div>
                      <div className="font-bold">{currentChat.name}</div>
                      <div className="text-xs text-[var(--color-fg-muted)]">
                        {currentChat.online ? 'Online' : 'Offline'}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-modern btn-secondary hover-scale">
                      📞
                    </button>
                    <button className="btn-modern btn-secondary hover-scale">
                      ⋮
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 animate-fadeIn">
                  {messages.map((msg, i) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'} animate-slideInUp`}
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <div
                        className={`max-w-xs px-4 py-2 rounded-lg ${
                          msg.sender === 'me'
                            ? 'bg-[var(--color-primary)] text-white rounded-br-none'
                            : 'bg-[var(--color-surface-2)] text-[var(--color-fg)] rounded-bl-none'
                        }`}
                      >
                        <p className="text-sm">{msg.text}</p>
                        <p className={`text-xs mt-1 ${msg.sender === 'me' ? 'text-white/70' : 'text-[var(--color-fg-muted)]'}`}>
                          {msg.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}

                  {typing && (
                    <div className="flex justify-start animate-pulse">
                      <div className="bg-[var(--color-surface-2)] px-4 py-2 rounded-lg rounded-bl-none">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-[var(--color-fg-muted)] rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-[var(--color-fg-muted)] rounded-full animate-bounce" style={{ animationDelay: '100ms' }}></div>
                          <div className="w-2 h-2 bg-[var(--color-fg-muted)] rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="border-t border-[var(--color-border)] p-4 animate-slideInUp">
                  <div className="flex gap-2">
                    <button className="btn-modern btn-secondary hover-scale">
                      📎
                    </button>
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onFocus={() => setTyping(true)}
                      onBlur={() => setTyping(false)}
                      placeholder="Type a message..."
                      className="input-modern flex-1"
                    />
                    <button className="btn-modern btn-primary hover-glow">
                      Send
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center animate-fadeIn">
                <div className="text-center">
                  <div className="text-5xl mb-4">💬</div>
                  <p className="text-[var(--color-fg-muted)]">Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedMessages;
