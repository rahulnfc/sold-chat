import { io } from "socket.io-client";

let socket;

export const connectSocket = (user) => {
  socket = io('https://sold.dxg.world', {
    auth: { token: user.token },
    transports: ["websocket"], 
    reconnectionAttempts: 5,
    reconnectionDelay: 3000,
  });
  return socket;
};

export const getSocket = () => {
  if (!socket) {
    throw new Error("Socket connection has not been initialized. Please log in first.");
  }
  return socket;
};
