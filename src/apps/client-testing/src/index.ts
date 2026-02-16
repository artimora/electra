import { ElectraClient, TCPNetworkingLayer } from "@artimora/electra";
import { sleep } from "bun";

const client = new ElectraClient({
	host: "127.0.0.1",
	port: 8080,
	networkingLayer: new TCPNetworkingLayer(),
	autoReconnect: { delayMs: 2000, maxAttempts: 10 },
});

client.onMessage.add((message) => {
	console.log("Received message:", message);
});

client.onConnection.add(() => {
	console.log("Connected to server");
});

client.onDisconnect.add(() => {
	console.log("Disconnected from server");
});

while (true) {
	client.send({
		id: "testing:time",
		values: {
			time: `${Date.now()}`,
		},
	});
	await sleep(1000);
}
