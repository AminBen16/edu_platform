import { Server } from "socket.io";

export function initSocket(server) {
  const io = new Server(server);

  io.on("connection", socket => {
    socket.on("message", data => {
      io.emit("message", data);
    });
  });
}
