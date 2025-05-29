import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:8000";

type EventCallback<T> = (data: T) => void;

interface WebSocketMessage {
  type: string;
  data: Record<string, unknown>;
  tenant_id: number;
}

interface ServerToClientEvents {
  status_update: (data: WebSocketMessage) => void;
  connected: (data: { message: string }) => void;
  subscribed: (data: { message: string; tenant_id: number }) => void;
  unsubscribed: (data: { message: string; tenant_id: number }) => void;
  error: (data: { message: string }) => void;
}

interface ClientToServerEvents {
  subscribe_organization: (data: { tenant_id: number }) => void;
  unsubscribe_organization: (data: { tenant_id: number }) => void;
}

class SocketClient {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents>;
  private listeners: Map<string, Set<EventCallback<unknown>>>;

  constructor(url: string) {
    this.socket = io(url, {
      autoConnect: false,
      transports: ["websocket"],
      // Production-friendly options
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
    });
    this.listeners = new Map();

    // Set up reconnection handling
    this.socket.on("connect", () => {
      console.log("Socket connected to:", url);
    });

    this.socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    this.socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    // Set up event listeners
    this.socket.on("status_update", (message: WebSocketMessage) => {
      // Route to specific event based on type
      this.emit(message.type, message.data);
    });
  }

  connect() {
    this.socket.connect();
  }

  disconnect() {
    this.socket.disconnect();
  }

  isConnected() {
    return this.socket.connected;
  }

  subscribeToOrganization(organizationId: number) {
    this.socket.emit("subscribe_organization", { tenant_id: organizationId });
  }

  unsubscribeFromOrganization(organizationId: number) {
    this.socket.emit("unsubscribe_organization", { tenant_id: organizationId });
  }

  on<T>(event: string, callback: EventCallback<T>) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback as EventCallback<unknown>);
  }

  off<T>(event: string, callback: EventCallback<T>) {
    this.listeners.get(event)?.delete(callback as EventCallback<unknown>);
  }

  private emit<T>(event: string, data: T) {
    this.listeners.get(event)?.forEach((callback) => {
      callback(data);
    });
  }
}

export const socket = new SocketClient(SOCKET_URL);
