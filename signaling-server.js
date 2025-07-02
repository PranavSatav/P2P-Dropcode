const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: process.env.PORT || 8080 });

const rooms = {};        // room => [ws1, ws2]
const messages = {};     // room => offer/answer/candidates

wss.on("connection", (ws) => {
  let joinedRoom = null;

  ws.on("message", (msg) => {
    try {
      const { type, room, data } = JSON.parse(msg);
      if (!rooms[room]) rooms[room] = [];
      if (!rooms[room].includes(ws)) {
        rooms[room].push(ws);
        joinedRoom = room;

        // replay saved offer if it exists
        if (messages[room]?.offer && type === "join") {
          ws.send(JSON.stringify({ type: "offer", data: messages[room].offer }));
        }
      }

      // Save offers for late-joining receivers
      if (type === "offer") {
        messages[room] = messages[room] || {};
        messages[room].offer = data;
      }

      // Relay to all other peers in the room
      rooms[room].forEach((client) => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type, data }));
        }
      });
    } catch (err) {
      console.error("Failed to process message:", err);
    }
  });

  ws.on("close", () => {
    if (joinedRoom && rooms[joinedRoom]) {
      rooms[joinedRoom] = rooms[joinedRoom].filter((client) => client !== ws);
      if (rooms[joinedRoom].length === 0) {
        delete rooms[joinedRoom];
        delete messages[joinedRoom];
      }
    }
  });
});

console.log("✅ Signaling server is running...");
