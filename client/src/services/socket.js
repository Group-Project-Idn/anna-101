import { io } from "socket.io-client";
import { baseUrl } from "../constant/baseUrl";

/**
 * Satu instance socket.io untuk seluruh halaman invite.
 * baseUrl = ".../api" sedangkan server socket menempel di origin yang sama,
 * jadi origin diturunkan dengan membuang suffix "/api".
 */
let socket = null;

export function getInviteSocket(token) {
  if (socket?.connected) {
    return socket;
  }

  if (socket) {
    socket.disconnect();
    socket = null;
  }

  const origin = baseUrl.replace(/\/api\/?$/, "");

  socket = io(origin, {
    auth: { token: `Bearer ${token}` },
    autoConnect: true,
  });

  return socket;
}

export function disconnectInviteSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
