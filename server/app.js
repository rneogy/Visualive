const express = require("express");
const path = require("path");

const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
let numConnected = 0;

const publicPath = path.resolve(__dirname, "..", "client", "dist");


app.use(express.static(publicPath));

http.listen(3000, () => {
  console.log(`Listening on port 3000 and looking in folder ${publicPath}`);
});

io.on("connection", (socket) => {
  numConnected += 1;
  console.log("a user connected they are user number " + numConnected);

  socket.on("keypress", () => {
    console.log("key has been pressed");
  })
});




