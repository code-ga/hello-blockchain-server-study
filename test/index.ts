import { io } from "socket.io-client";

const socket = io("localhost:8000");
console.log(socket.connect());
socket.on("connect", () => {
  console.log(socket.id); // x8WIv7-mJelg7on_ALbx
});

socket.on("disconnect", () => {
  console.log(socket.id); // undefined
});