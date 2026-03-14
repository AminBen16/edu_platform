"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocket = initSocket;
const socket_io_1 = require("socket.io");
function initSocket(server) {
    const io = new socket_io_1.Server(server);
    io.on("connection", (socket) => {
        socket.on("message", (data) => {
            io.emit("message", data);
        });
    });
}
