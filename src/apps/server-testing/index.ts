import net from "node:net";
import { ElectraServer, TCPNetworkingLayer } from "@artimora/electra";

const server = new ElectraServer({
	networkingLayer: new TCPNetworkingLayer(),
	port: 8080,
});

// var clients: net.Socket[] = [];

// var s = net.createServer((socket) => {
// 	clients.push(socket);
// 	clients[0].write(new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]));
// });

// var socket = new net.Socket();
// socket.connect(8080, "127.0.0.1");
// socket.write(new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]));
