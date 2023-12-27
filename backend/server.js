const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 3001;

app.use(express.static(path.join(__dirname, "..", "frontend")));

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("joinRoom", (roomCode) => {
    socket.join(roomCode);
    console.log(`User joined room: ${roomCode}`);
    io.to(roomCode).emit("userJoined", socket.id);
  });

  socket.on("generateRoom", () => {
    const generatedRoomCode = generateRoomCode();
    io.emit("roomCode", generatedRoomCode); // Emit to all connected clients
  });

  socket.on("drawing", (data) => {
    console.log("Received drawing data:", data);
    io.to(data.room).emit("drawing", data.points);
  });

  socket.on("clearCanvas", (roomCode) => {
    io.to(roomCode).emit("clearCanvas");
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
    const rooms = Object.keys(socket.rooms);

    for (const room of rooms) {
      io.to(room).emit("userDisconnected", socket.id);
    }
  });
});

function generateRoomCode() {
  const alphanumeric =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let roomCode = "";
  for (let i = 0; i < 9; i++) {
    roomCode += alphanumeric.charAt(
      Math.floor(Math.random() * alphanumeric.length)
    );
  }
  return roomCode;
}

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
