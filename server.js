const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const rooms = new Map();

app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});
app.use(express.static(__dirname));

const WIN_COMBINATION = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function checkWinner(b) {
  for (let [a, c, d] of WIN_COMBINATION) {
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a];
  }
  return b.includes(null) ? null : "DRAW";
}

io.on("connection", (socket) => {
  let userRoom = null;

  socket.on("join", (roomName) => {
    userRoom = roomName;
    let room = rooms.get(roomName);

    if (!room) {
      room = {
        players: { X: socket.id, O: null },
        board: Array(9).fill(null),
        turn: "X",
      };
      rooms.set(roomName, room);
      socket.join(roomName);
      socket.emit("init", "X");
    } else if (!room.players.O) {
      room.players.O = socket.id;
      socket.join(roomName);
      socket.emit("init", "O");
      io.to(roomName).emit("update", room);
    }
  });

  socket.on("move", (index) => {
    const room = rooms.get(userRoom);
    if (!room) return;

    const symbol = room.players.X === socket.id ? "X" : "O";
    if (room.turn !== symbol || room.board[index] !== null) return;

    room.board[index] = symbol;
    const winner = checkWinner(room.board);

    if (winner) {
      io.to(userRoom).emit("over", { board: room.board, winner });
      rooms.delete(userRoom);
    } else {
      room.turn = room.turn === "X" ? "O" : "X";
      io.to(userRoom).emit("update", room);
    }
  });

  socket.on("disconnect", () => {
    if (userRoom && rooms.has(userRoom)) {
      io.to(userRoom).emit("reset");
      rooms.delete(userRoom);
    }
  });
});

server.listen(3000, () => console.log("Running on http://localhost:3000"));
