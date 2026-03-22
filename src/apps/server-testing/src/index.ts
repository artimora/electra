import { ElectraServer, TCPNetworkingLayer } from "@artimora/electra";
import { sleep } from "bun";

const server = new ElectraServer({
	networkingLayer: new TCPNetworkingLayer(),
	port: 8080,
});

server.onClientConnect.add((clientId) => {
	console.log(`${clientId} connected`);
});

server.onMessage.add(({ clientId, message }) => {
	console.log(`${clientId}: ${message.id}`);
});

server.onClientDisconnect.add((clientId) => {
	console.log(`${clientId} disconnected`);
});

server.registerFunction("addition", (args) => {
	const workTime = Math.floor(Math.random() * (1500 - 250 + 1)) + 250;
	const until = Date.now() + workTime;
	while (Date.now() < until) {
		// intentionally block to test client timeout behavior
	}

	console.log(`sleep: ${workTime}`);

	const left = Number.parseInt(args.left ?? "0", 10);
	const right = Number.parseInt(args.right ?? "0", 10);

	return {
		result: `${left + right}`,
	};
});

while (true) {
	const clients = server.getClients().map((_, i) => `${i + 1}`);
	const identities = server
		.getClientIdentities()
		.map((identity) => identity ?? "null");

	console.log("Clients", clients);
	console.log(`Client Identities (${identities.length})`, identities);

	await sleep(1000);
}
