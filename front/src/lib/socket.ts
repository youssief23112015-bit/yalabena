import { io, Socket } from "socket.io-client";
import { useAuthStore } from "@/store/authStore";
import type { AppNotification } from "@/types";

/**
 * Singleton socket for the realtime notification center (SRS 4.18).
 * Connects to the `notifications` namespace with the current JWT;
 * the server joins the socket into the private room `user:<id>`.
 */
const WS_BASE_URL =
  import.meta.env.VITE_WS_URL ||
  (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1").replace(
    /\/api\/v1\/?$/,
    "",
  );

let socket: Socket | null = null;
let socketToken: string | null = null;

export function getNotificationsSocket(): Socket | null {
  const token = useAuthStore.getState().accessToken;
  if (!token) return null;

  // Reconnect if the token changed (login / refresh).
  if (socket && socketToken !== token) {
    socket.disconnect();
    socket = null;
  }

  if (!socket) {
    socketToken = token;
    socket = io(`${WS_BASE_URL}/notifications`, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 2000,
    });
  }
  return socket;
}

export function disconnectNotificationsSocket(): void {
  socket?.disconnect();
  socket = null;
  socketToken = null;
}

export type NotificationEventHandler = (notification: AppNotification) => void;
