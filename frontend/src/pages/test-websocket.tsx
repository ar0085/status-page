import React, { useEffect, useState } from "react";
import { socket } from "../lib/socket";

const WebSocketTest = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    socket.connect();

    socket.on("connect", () => {
      setIsConnected(true);
      addMessage("🟢 Connected to WebSocket");
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
      addMessage("🔴 Disconnected from WebSocket");
    });

    // Listen to all event types
    socket.on("service_update", (data) => {
      addMessage(`🔧 Service Update: ${JSON.stringify(data)}`);
    });

    socket.on("incident_created", (data) => {
      addMessage(`🚨 Incident Created: ${JSON.stringify(data)}`);
    });

    socket.on("incident_update", (data) => {
      addMessage(`🚨 Incident Updated: ${JSON.stringify(data)}`);
    });

    socket.on("maintenance_created", (data) => {
      addMessage(`🔧 Maintenance Created: ${JSON.stringify(data)}`);
    });

    socket.on("maintenance_update", (data) => {
      addMessage(`🔧 Maintenance Updated: ${JSON.stringify(data)}`);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const addMessage = (msg: string) => {
    setMessages((prev) =>
      [...prev, `${new Date().toLocaleTimeString()}: ${msg}`].slice(-10)
    ); // Keep only last 10 messages
  };

  const testSubscription = () => {
    // Subscribe to organization ID 1 for testing
    socket.subscribeToOrganization(1);
    addMessage("📡 Subscribed to organization 1");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">WebSocket Test Page</h1>

      <div className="mb-4">
        <div
          className={`inline-block px-3 py-1 rounded-full text-sm ${
            isConnected
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
        </div>
      </div>

      <button
        onClick={testSubscription}
        className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Subscribe to Organization 1
      </button>

      <div className="bg-gray-100 rounded-lg p-4 h-64 overflow-y-auto">
        <h3 className="font-medium mb-2">Real-time Messages:</h3>
        {messages.length === 0 ? (
          <p className="text-gray-500">No messages yet...</p>
        ) : (
          <div className="space-y-1">
            {messages.map((msg, idx) => (
              <div key={idx} className="text-sm font-mono">
                {msg}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p>
          <strong>Instructions:</strong>
        </p>
        <ol className="list-decimal list-inside space-y-1">
          <li>
            Click "Subscribe to Organization 1" to start receiving updates
          </li>
          <li>
            Go to your dashboard and create/update/delete services, incidents,
            or maintenance
          </li>
          <li>Watch real-time events appear in the message log above</li>
        </ol>
      </div>
    </div>
  );
};

export default WebSocketTest;
