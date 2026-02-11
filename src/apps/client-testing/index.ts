import { ElectraClient, TCPNetworkingLayer } from "@artimora/electra";

const client = new ElectraClient({
	networkingLayer: new TCPNetworkingLayer(),
	host: "127.0.0.1",
	port: 8080,
});
