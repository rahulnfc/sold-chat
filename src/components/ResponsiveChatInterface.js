import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { ChevronLeft, Send, Menu, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import io from 'socket.io-client';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useNavigate, useParams } from 'react-router-dom';

const ResponsiveChatInterface = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversationPage, setConversationPage] = useState(1);
  const [messagePage, setMessagePage] = useState(1);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);

  const headers = useMemo(() => ({ Authorization: `Bearer ${user?.token}` }), [user]);

  const fetchConversations = useCallback(async (page) => {
    try {
      const response = await axios.get(`http://localhost:8000/api/conversations?page=${page}&limit=10`, { headers });
      const newConversations = response.data.data;

      setConversations(prev => [
        ...prev.filter(prevConvo => !newConversations.some(newConvo => newConvo._id === prevConvo._id)),
        ...newConversations,
      ]);
    } catch (err) {
      console.error('Failed to fetch conversations', err);
    }
  }, [headers]);

  const fetchMessages = useCallback(async (chatId, page) => {
    try {
      const response = await axios.get(`http://localhost:8000/api/messages/${chatId}?page=${page}&limit=10`, { headers });
      const newMessages = response.data.data;
      setMessages(prev => [
        ...prev.filter(prevMessage => !newMessages.some(newMessage => newMessage._id === prevMessage._id)),
        ...newMessages]);
    } catch (err) {
      console.error('Failed to fetch messages', err);
    }
  }, [headers]);

  useEffect(() => {
    fetchConversations(conversationPage);
  }, [fetchConversations, conversationPage]);

  const chatList = useMemo(() => conversations.map(convo => ({
    id: convo._id,
    title: convo.postId.title,
    user: convo.participants.find(participant => participant._id !== user.id)?.name,
    time: convo.lastMessage?.timestamp ? new Date(convo.lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "",
    message: convo.lastMessage?.message || "",
    name: convo.lastMessage?.senderId?._id === user.id ? "You" : convo.lastMessage?.senderId?.name || ""
  })), [conversations, user.id]);

  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
    setMessages([]);
    setMessagePage(1);
    fetchMessages(chat.id, 1);
    setIsSidebarOpen(false);
  };

  useEffect(() => {
    if (!user || !user.token) return;

    const newSocket = io('http://localhost:8000', { auth: { token: user.token } });
    setSocket(newSocket);

    if (selectedChat?.id) newSocket.emit('join:conversation', selectedChat.id);

    newSocket.on('message:new', (data) => {
      setMessages(prev => [...prev, data.message]);
    });

    newSocket.on('conversation:typing', ({ conversationId, isTyping }) => {
      if (conversationId === selectedChat?.id) setIsTyping(isTyping);
    });

    newSocket.on('message:read', ({ conversationId, messageIds, readAt }) => {
      if (selectedChat?.id === conversationId) {
        setMessages(prev => prev.map(msg => 
          messageIds.includes(msg._id) ? { ...msg, status: 'read', readAt } : msg
        ));
      }
    });

    return () => newSocket.close();
  }, [user, selectedChat?.id]);

  useEffect(() => {
    if (id) {
      const chat = chatList.find(c => c.id === id);
      if (chat) handleChatSelect(chat);
    }
  }, [chatList, id]);

  const handleSendMessage = () => {
    if (message.trim() && socket && selectedChat) {
      socket.emit('message:send', { conversationId: selectedChat.id, content: message });
      setMessage('');
    }
  };

  const handleTyping = () => {
    if (socket && selectedChat) {
      socket.emit('typing:start', selectedChat.id);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing:stop', selectedChat.id);
      }, 1000);
    }
  };

  const handleMarkMessagesAsRead = useCallback(() => {
    const unreadMessages = messages.filter(msg => msg.status !== 'read' && msg.senderId._id !== user.id);
    if (unreadMessages.length && socket && selectedChat) {
      const messageIds = unreadMessages.map(msg => msg._id);
      socket.emit('message:read', { conversationId: selectedChat.id, messageIds });
    }
  }, [messages, selectedChat, socket, user.id]);

  useEffect(() => {
    if (selectedChat) handleMarkMessagesAsRead();
  }, [selectedChat, messages, handleMarkMessagesAsRead]);

  // Infinite scrolling for conversations
  const handleConversationScroll = (e) => {
    if (e.target.scrollTop + e.target.clientHeight >= e.target.scrollHeight - 100) {
      setConversationPage(prevPage => prevPage + 1);
    }
  };

  // Infinite scrolling for messages
  const handleMessagesScroll = (e) => {
    if (e.target.scrollTop === 0 && selectedChat) {
      setMessagePage(prevPage => prevPage + 1);
      fetchMessages(selectedChat.id, messagePage + 1);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden absolute top-4 left-4 z-50 p-2 rounded-lg bg-white shadow">
        {isSidebarOpen ? <X /> : <Menu />}
      </button>

      <div onScroll={handleConversationScroll} className={`${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 fixed lg:static w-full lg:w-1/3 h-full bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out z-40`}>
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
              onClick={() => navigate(`/chats/${chat.id}`)}
              className={`flex items-center p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors duration-200 ${selectedChat?.id === chat.id ? "bg-gray-50" : ""}`}
            >
              <div className="w-12 h-12 bg-gray-200 rounded-md"></div>
              <div className="ml-3 flex-1">
                <div className="flex justify-between">
                  <h3 className="text-sm font-medium">{chat.title}</h3>
                  <span className="text-xs text-gray-500">{chat.time}</span>
                </div>
                {chat.name && <p className="text-sm text-gray-500 mt-1">{`${chat.name}: ${chat.message}`}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedChat && (
          <>
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-200 rounded-md"></div>
                <div className="ml-3">
                  <h2 className="text-lg font-medium">{selectedChat?.title}</h2>
                  {isTyping ? <p className="text-xs italic text-gray-500">{selectedChat?.user} is typing...</p> : <p className="text-sm text-gray-500">{selectedChat?.user}</p>}
                </div>
              </div>
            </div>

            <div onScroll={handleMessagesScroll} className="flex-1 overflow-y-auto p-4 bg-gray-50">
              {messages.map((msg, index) => (
                <div key={msg._id} className={`flex ${msg.senderId._id === user.id ? "justify-end" : "justify-start"} mb-4`}>
                  <div className={`max-w-[70%] rounded-lg p-3 ${msg.senderId._id === user.id ? "bg-gray-200 text-black" : "bg-red-500 text-white"}`}>
                    <p className="text-sm break-words">{msg.content}</p>
                    <span className="text-xs mt-1 block opacity-70">{new Date(msg.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type a message..." onKeyPress={handleTyping} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} />
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
