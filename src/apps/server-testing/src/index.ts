import { ElectraServer, TCPNetworkingLayer } from "@artimora/electra";
import { sleep } from "bun";

const server = new ElectraServer({
	networkingLayer: new TCPNetworkingLayer(),
	port: 8080,
});

server.onMessage.add((message) => {
	console.log(
		`Received message from client ${message.clientId}:`,
		message.message,
	);
});

while (true) {
	server.sendToAllClients({
		id: "testing:time",
		values: {
			time: `${Date.now()}`,
		},
	});
	await sleep(1000);
}
