const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");
const env = require("./config/env");
const sequelize = require("./config/database");
const { initModels } = require("./db/models");

async function bootstrap() {
  try {
    initModels();
    await sequelize.authenticate();

    const server = http.createServer(app);
    const io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    // ──── Agent session tracking ────
    // Map: agentId -> { socketId, name, rooms: Set }
    const agentSockets = new Map();

    io.on("connection", (socket) => {
      console.log("[IO] Connected:", socket.id);

      // ─── Agent registers after login ───
      socket.on("agent-register", (data) => {
        const { agentId, name } = data;
        if (!agentId) return;

        // If this agent already has an old socket → disconnect it
        const existing = agentSockets.get(agentId);
        if (existing && existing.socketId !== socket.id) {
          const oldSocket = io.sockets.sockets.get(existing.socketId);
          if (oldSocket && oldSocket.connected) {
            // Give a small grace period before force-disconnecting
            oldSocket.emit("force-logout", { reason: "Another session started" });
            setTimeout(() => {
              if (oldSocket.connected) {
                oldSocket.disconnect(true);
              }
            }, 500);
          }
          console.log(`[IO] Agent ${agentId} old socket ${existing.socketId} replaced by ${socket.id}`);
        }

        agentSockets.set(agentId, {
          socketId: socket.id,
          name: name || "Agent",
          rooms: new Set()
        });
        console.log(`[IO] Agent ${agentId} registered with socket ${socket.id}`);
      });

      // ─── Agent logout ───
      socket.on("agent-logout", () => {
        // Find and remove this agent from tracking
        for (const [agentId, info] of agentSockets.entries()) {
          if (info.socketId === socket.id) {
            // Leave all rooms
            info.rooms.forEach((roomId) => socket.leave(String(roomId)));
            agentSockets.delete(agentId);
            console.log(`[IO] Agent ${agentId} logged out, socket ${socket.id}`);
            break;
          }
        }
      });

      // ─── Join a conversation room ───
      socket.on("join-room", (roomId) => {
        socket.join(String(roomId));
        console.log(`[IO] ${socket.id} joined room ${roomId}`);

        // Track room for agent
        for (const [, info] of agentSockets.entries()) {
          if (info.socketId === socket.id) {
            info.rooms.add(String(roomId));
            break;
          }
        }

        socket.to(String(roomId)).emit("user-joined", socket.id);
      });

      // ─── Leave a conversation room ───
      socket.on("leave-room", (roomId) => {
        socket.leave(String(roomId));
        for (const [, info] of agentSockets.entries()) {
          if (info.socketId === socket.id) {
            info.rooms.delete(String(roomId));
            break;
          }
        }
      });

      // ─── Chat assigned to an agent → notify all agents to refresh ───
      socket.on("chat-assigned", (data) => {
        // Broadcast to ALL connected sockets so other agents update their list
        socket.broadcast.emit("chat-list-updated", {
          conversationId: data.conversationId,
          assignedAgentId: data.agentId,
          agentName: data.agentName
        });
      });

      // ─── New message → notify room + all agents to refresh ───
      socket.on("new-message", (data) => {
        socket.to(String(data.roomId)).emit("message-received", data);
        // Also signal all agents to refresh their chat list (for last message preview)
        socket.broadcast.emit("chat-list-updated", { conversationId: data.roomId });
      });

      // ─── Request all agents to refresh chat list ───
      socket.on("refresh-chats", () => {
        io.emit("chat-list-updated", {});
      });

      // ─── WebRTC Signaling ───
      socket.on("offer", (data) => {
        socket.to(String(data.roomId)).emit("offer", { offer: data.offer, from: socket.id });
      });

      socket.on("answer", (data) => {
        socket.to(String(data.roomId)).emit("answer", { answer: data.answer, from: socket.id });
      });

      socket.on("ice-candidate", (data) => {
        socket.to(String(data.roomId)).emit("ice-candidate", { candidate: data.candidate, from: socket.id });
      });

      socket.on("call-ended", (data) => {
        socket.to(String(data.roomId)).emit("call-ended");
      });

      socket.on("end-chat", (data) => {
        socket.to(String(data.roomId)).emit("chat-closed");
        // Notify all agents to refresh
        io.emit("chat-list-updated", { conversationId: data.roomId });
      });

      // ─── Disconnect cleanup ───
      socket.on("disconnect", () => {
        for (const [agentId, info] of agentSockets.entries()) {
          if (info.socketId === socket.id) {
            agentSockets.delete(agentId);
            console.log(`[IO] Agent ${agentId} disconnected (socket ${socket.id})`);
            break;
          }
        }
        console.log("[IO] Disconnected:", socket.id);
      });
    });

    server.listen(env.port, "0.0.0.0", () => {
      // eslint-disable-next-line no-console
      console.log(`Server listening on 0.0.0.0:${env.port}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to start server", error);
    process.exit(1);
  }
}

bootstrap();

