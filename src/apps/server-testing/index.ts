import { ElectraServer, TCPNetworkingLayer } from "@artimora/electra";

const server = new ElectraServer({
	networkingLayer: new TCPNetworkingLayer(),
	port: 8080,
});
