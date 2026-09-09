const socket = io();
let player = null;
let turn = false;

for (let i = 0; i < 9; i++) {
  const btn = document.createElement("button");
  btn.className = "cell";
  btn.disabled = true;
  btn.onclick = () => socket.emit("move", i);
  board.appendChild(btn);
}
const cells = board.querySelectorAll(".cell");

function join() {
  socket.emit("join", room.value);
}

socket.on("init", (symbol) => {
  player = symbol;
  title.innerText = "Joined as " + symbol + ". Waiting...";
});

socket.on("update", (data) => {
  turn = data.turn === player;
  title.innerText = turn ? "Your turn!" : "Opponent's turn";

  cells.forEach((btn, i) => {
    btn.innerText = data.board[i] || "";
    btn.disabled = !turn || data.board[i] !== null;
  });
});

socket.on("over", (data) => {
  cells.forEach((btn, i) => (btn.innerText = data.board[i] || ""));
  title.innerText = data.winner === "DRAW" ? "Draw!" : "Winner: " + data.winner;
  cells.forEach((btn) => (btn.disabled = true));
});

socket.on("reset", () => {
  title.innerText = "Opponent left.";
  cells.forEach((btn) => {
    btn.innerText = "";
    btn.disabled = true;
  });
});
