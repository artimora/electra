import { ElectraClient, TCPNetworkingLayer } from "@artimora/electra";
import { sleep } from "bun";

const client = new ElectraClient({
	networkingLayer: new TCPNetworkingLayer(),
	host: "127.0.0.1",
	port: 8080,
});

while (true) {
	client.send(new Uint8Array([Date.now()]));
	await sleep(1000);
}
