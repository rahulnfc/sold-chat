import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const Chat = ({ postId, postOwnerId }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const newSocket = io('http://user.sold.dxg.world');
    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.emit('join_chat', postId);

      socket.on('receive_message', (data) => {
        setMessages((prev) => [...prev, data]);
      });
    }
  }, [socket, postId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const sendMessage = () => {
    if (message.trim() && socket) {
      const messageData = {
        chatId: postId,
        sender: user.token,
        content: message,
        timestamp: new Date()
      };

      socket.emit('send_message', messageData);
      setMessage('');
    }
  };

  return (
    <Card className="h-[500px] flex flex-col">
      <CardContent className="flex-1 overflow-y-auto p-4">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`mb-4 ${msg.sender === user.token ? 'text-right' : 'text-left'}`}
          >
            <div
              className={`inline-block max-w-[70%] rounded-lg p-3 ${
                msg.sender === user.token ? 'bg-blue-100' : 'bg-gray-100'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </CardContent>
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          />
          <Button onClick={sendMessage}>Send</Button>
        </div>
      </div>
    </Card>
  );
};

export default Chat;