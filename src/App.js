import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import PostDetail from './pages/PostDetail';
import { AuthProvider } from './context/AuthContext';
import Chat from './components/Chat';
import ResponsiveChatInterface from './components/ResponsiveChatInterface';
import { SocketProvider } from './context/SocketContext';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/posts/:id" element={<PostDetail />} />
                <Route path="/chats" element={<ResponsiveChatInterface />} />
                <Route path="/chats/:id" element={<ResponsiveChatInterface />} />
              </Routes>
            </div>
          </div>
        </Router>
      </SocketProvider>

    </AuthProvider>
  );
}

export default App;