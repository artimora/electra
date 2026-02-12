import type net from "node:net";
export type NetworkLayerState = "server" | "client" | "disconnected";

export type NetworkLayer =
	| (BaseNetworkLayer & { getState(): "disconnected" })
	| (BaseNetworkLayer & { getState(): "server" })
	| (BaseNetworkLayer & { getState(): "client" });

export interface BaseNetworkLayer {
	getState(): NetworkLayerState;
	send(data: Uint8Array): void;
	stop(): void;

	startServer(options: ServerInitializationOptions): void;
	startClient(options: ClientInitializationOptions): void;

	sendToClient(clientId: number, data: Uint8Array): void;
	getClients(): net.Socket[];
}

export type ServerInitializationOptions = {
	port: number;
};

export type ClientInitializationOptions = {
	host: string;
	port: number;
};
