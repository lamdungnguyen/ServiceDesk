import { createContext, useContext, useRef, useCallback, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

const SOCKET_URL =
  import.meta.env.VITE_API_BASE_URL?.replace("/api", "") ||
  "http://localhost:8080";

export function SocketProvider({ children }) {
  const { user, isAuthenticated, logout } = useAuth();
  const socketRef = useRef(null);
  const [, forceUpdate] = useState(0);

  /**
   * Create socket connection once when user logs in.
   * Destroy when user logs out or changes.
   */
  useEffect(() => {
    // No user → no socket
    if (!user || !isAuthenticated) {
      if (socketRef.current) {
        socketRef.current.emit("agent-logout");
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
        console.log("[Socket] Cleaned up — user logged out");
      }
      return;
    }

    // If socket already exists for this user → skip
    if (socketRef.current && socketRef.current._userId === user.id) {
      return;
    }

    // If socket exists for a different user → kill it first
    if (socketRef.current && socketRef.current._userId !== user.id) {
      socketRef.current.emit("agent-logout");
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
      console.log("[Socket] Killed old socket for different user");
    }

    // Create new socket
    const socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      transports: ["websocket", "polling"],
    });

    socket._userId = user.id;

    socket.on("connect", () => {
      console.log("[Socket] Connected:", socket.id, "for user:", user.id);
      const normalizedRole = String(user.role || "").trim().toLowerCase();
      const isAdmin = normalizedRole === "admin";
      // Register agent identity on server
      if (normalizedRole) {
        socket.emit("agent-register", {
          agentId: user.id,
          name: user.name,
          role: isAdmin ? "admin" : "agent",
        });
      }
      forceUpdate((n) => n + 1); // trigger re-render so consumers get the live socket
    });

    socket.on("disconnect", (reason) => {
      console.log("[Socket] Disconnected:", reason);
    });

    socket.on("force-logout", (data) => {
      console.warn("[Socket] Force logout:", data?.reason);
      alert("Your session was ended because you logged in from another device.");
      logout();
    });

    socketRef.current = socket;

    // Cleanup on unmount or user change
    return () => {
      if (socketRef.current === socket) {
        socket.emit("agent-logout");
        socket.removeAllListeners();
        socket.disconnect();
        socketRef.current = null;
        console.log("[Socket] Cleanup on effect teardown");
      }
    };
  }, [user?.id, user?.name, user?.role, isAuthenticated, logout]);

  /**
   * Get the current socket (read-only, never creates a new one).
   */
  const getSocket = useCallback(() => {
    return socketRef.current;
  }, []);

  /**
   * Explicitly destroy the socket. Called before logout.
   */
  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit("agent-logout");
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
      console.log("[Socket] Destroyed on explicit logout");
    }
  }, []);

  return (
    <SocketContext.Provider value={{ getSocket, disconnectSocket }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
