import { ElectraClient, TCPNetworkingLayer } from "@artimora/electra";
import { sleep } from "bun";

const client = new ElectraClient({
	networkingLayer: new TCPNetworkingLayer(),
	host: "127.0.0.1",
	port: 8080,
});

client.onMessage.add((message) => {
	console.log("Received message:", message);
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
