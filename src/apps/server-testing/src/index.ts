import { ElectraServer, TCPNetworkingLayer } from "@artimora/electra";
import { sleep } from "bun";

const server = new ElectraServer({
	networkingLayer: new TCPNetworkingLayer(),
	port: 8080,
});

while (true) {
	server.sendToAllClients(new Uint8Array([Date.now()]));
	await sleep(1000);
}
