// frontend/src/services/socket.js
import { io } from 'socket.io-client';

// Use Vite environment variable for the backend URL
const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';
let socket;

export const connectSocket = () => {
  const user = JSON.parse(localStorage.getItem('userInfo'));

  socket = io(SOCKET_URL, {
    auth: { token: user?.token },
    transports: ['websocket']
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    throw new Error('Socket not connected!');
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};