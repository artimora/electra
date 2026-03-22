import { ElectraClient, TCPNetworkingLayer } from "@artimora/electra";
import { sleep } from "bun";

const client = new ElectraClient({
	host: "127.0.0.1",
	port: 8080,
	functionTimeout: 1000,
	networkingLayer: new TCPNetworkingLayer(),
	autoReconnect: { delayMs: 100, maxAttempts: 5 },
});

client.onMessage.add((message) => {
	console.log(message.id);
});

client.onConnection.add(() => {
	console.log("Connected");
});

client.onDisconnect.add(() => {
	console.log("Disconnected");
});

while (true) {
	const left = 1;
	const right = 2;

	const results = await client.callFunction("addition", {
		left: `${left}`,
		right: `${right}`,
	});

	if (results.result) {
		console.log(`${left} + ${right} = ${results.result}`);
	} else {
		console.error(`Couldn't get result. Error value: ${results["artimora:error"]}`);
	}

	await sleep(1000);
}
