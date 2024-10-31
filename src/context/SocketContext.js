// src/context/SocketContext.js
import React, { createContext, useContext, useEffect, useState } from "react";
import { connectSocket, getSocket } from "../socket";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({children }) => {
const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (user) {
      const newSocket = connectSocket(user);
      setSocket(newSocket);
        console.log('newSocket',newSocket)
        newSocket.on("connect", () => {
        console.log("Socket connected with ID:", newSocket.id);
      });

      newSocket.on("disconnect", () => {
        console.log("Socket disconnected");
      });

      return () => {
        newSocket.disconnect(); // Clean up socket on component unmount
      };
    }
  }, [user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
