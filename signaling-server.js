const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: process.env.PORT || 8080 });
const rooms = {};

wss.on("connection", (ws) => {
  ws.on("message", (msg) => {
    try {
      const { type, room, data } = JSON.parse(msg);

      if (!rooms[room]) {
        rooms[room] = [];
      }

      if (!rooms[room].includes(ws)) {
        rooms[room].push(ws);
      }

      rooms[room].forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type, data }));
        }
      });
    } catch (err) {
      console.error("Error parsing message:", err);
    }
  });

  ws.on("close", () => {
    for (const room in rooms) {
      rooms[room] = rooms[room].filter((client) => client !== ws);
      if (rooms[room].length === 0) {
        delete rooms[room];
      }
    }
  });
});

console.log("Signaling server running...");
