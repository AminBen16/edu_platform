import { Server, Socket } from "socket.io";
import { Server as HTTPServer } from "http";

export function initSocket(server: HTTPServer) {
  const io = new Server(server);

  io.on("connection", (socket: Socket) => {
    socket.on("message", (data: any) => {
      io.emit("message", data);
    });
  });
}
