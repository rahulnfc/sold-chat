import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, Send, Menu, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import io from 'socket.io-client';
import { Input } from './ui/input';
import { Button } from './ui/button';

const ResponsiveChatInterface = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const headers = { Authorization: `Bearer ${user.token}` };
        const response = await axios.get('http://localhost:8000/api/conversations?page=1&limit=10', { headers });
        setConversations(response.data.data);
      } catch (err) {
        console.error('Failed to fetch conversations', err);
      }
    };
    fetchConversations();
  }, [user]);

  console.log(JSON.stringify(user, null, 2))

  const chatList = conversations.map(conversation => ({
    id: conversation._id,
    title: conversation.postId.title,
    user: conversation.participants.find(participant => participant._id !== user.id).name,
    time: conversation.lastMessage.timestamp ? new Date(conversation.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "",
    message: conversation.lastMessage?.message || "",
    name: conversation.lastMessage?.senderId?._id === user.id ? "You" : conversation.lastMessage.senderId.name || ""
  }));

  const fetchMessages = async (chatId) => {
    try {
      const headers = { Authorization: `Bearer ${user.token}` };
      const response = await axios.get(`http://localhost:8000/api/messages/${chatId}?page=1&limit=10`, { headers });
      setMessages(response.data.data);
    } catch (err) {
      console.error('Failed to fetch messages', err);
    }
  };

  useEffect(() => {
    if (!user || !user.token) return;

    const newSocket = io('http://localhost:8000', {
      auth: {
        token: user.token,
      },
    });

    setSocket(newSocket);

    newSocket.emit('join:conversations', conversations.map(convo => convo._id));

    newSocket.on('message:new', (data) => {
      setMessages((prev) => [...prev, data.message]);
    });

    newSocket.on('conversation:typing', ({ conversationId, userId, isTyping }) => {
      if (conversationId === selectedChat?.id) {
        setIsTyping(isTyping);
      }
    });

    newSocket.on('message:read', ({ conversationId, messageIds, readAt }) => {
      if (selectedChat?.id === conversationId) {
        setMessages((prev) =>
          prev.map((msg) => messageIds.includes(msg._id) ? { ...msg, status: 'read', readAt } : msg)
        );
      }
    });

    return () => newSocket.close();
  }, [user, conversations, selectedChat, messages]);

  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
    fetchMessages(chat.id);
    setIsSidebarOpen(false);
  };

  const handleSendMessage = () => {
    if (message.trim() && socket) {
      socket.emit('message:send', {
        conversationId: selectedChat.id,
        content: message,
      });
      setMessage('');
    }
  };

  const handleTyping = () => {
    if (socket) {
      socket.emit('typing:start', selectedChat.id);
      clearTimeout(typingTimeoutRef.current);

      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing:stop', selectedChat.id);
      }, 1000);
    }
  };

  const handleMarkMessagesAsRead = () => {
    const unreadMessages = messages.filter((msg) => msg.status !== 'read' && msg.senderId._id !== user.id);
    if (unreadMessages.length && socket) {
      const messageIds = unreadMessages.map((msg) => msg._id);
      socket.emit('message:read', {
        conversationId: selectedChat.id,
        messageIds
      });
    }
  };

  useEffect(() => {
    if (selectedChat) {
      handleMarkMessagesAsRead();
    }
  }, [selectedChat, messages]);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden absolute top-4 left-4 z-50 p-2 rounded-lg bg-white shadow"
      >
        {isSidebarOpen ? <X /> : <Menu />}
      </button>

      {/* Sidebar */}
      <div
        className={`${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 fixed lg:static w-full lg:w-1/3 h-full bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out z-40`}
      >
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center">
            <ChevronLeft className="h-6 w-6 text-gray-600" />
            <span className="ml-2 text-gray-600">Chats</span>
          </div>
        </div>
        <div className="overflow-y-auto h-[calc(100%-64px)]">
          {chatList.map((chat) => (
            <div
              key={chat.id}
              onClick={() => handleChatSelect(chat)}
              className={`flex items-center p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors duration-200 ${selectedChat?.id === chat.id ? "bg-gray-50" : ""}`}
            >
              <div className="w-12 h-12 bg-gray-200 rounded-md"></div>
              <div className="ml-3 flex-1">
                <div className="flex justify-between">
                  <h3 className="text-sm font-medium">{chat.title}</h3>
                  <span className="text-xs text-gray-500">{chat.time}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">{`${chat.name}: ${chat.message}`}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat && (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-200 rounded-md"></div>
                <div className="ml-3">
                  <h2 className="text-lg font-medium">{selectedChat?.title}</h2>
                  {isTyping
                    ? <p className="text-xs italic text-gray-500">{selectedChat?.user} is typing...</p>
                    : <p className="text-sm text-gray-500">{selectedChat?.user}</p>
                  }
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.senderId._id === user.id ? "justify-end" : "justify-start"} mb-4`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${message.senderId._id === user.id
                        ? "bg-gray-200 text-black"
                        : "bg-red-500 text-white"
                      }`}
                  >
                    <p className="text-sm break-words">{message.content}</p>
                    <span className="text-xs mt-1 block opacity-70">
                      {new Date(message.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  onKeyPress={handleTyping}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button onClick={handleSendMessage}>Send</Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ResponsiveChatInterface;
