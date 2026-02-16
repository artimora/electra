import type net from "node:net";
export type NetworkLayerState = "server" | "client" | "disconnected";

export interface NetworkLayer {
	getState(): NetworkLayerState;
	send(data: Uint8Array): void;
	stop(): void;

	startServer(options: ServerInitializationOptions): void;
	startClient(options: ClientInitializationOptions): void;

	sendToClient(clientId: number, data: Uint8Array): void;
	getClients(): net.Socket[];

	setOnMessage(handler?: RawMessageHandler): void;
}

export type ServerInitializationOptions = {
	port: number;
};

export type ClientInitializationOptions = {
	host: string;
	port: number;
};

export type Message = {
	id: `${string}:${string}`;
	values: { [key: string]: string };
};

export type RawMessageHandler = (
	payload: Uint8Array,
	meta: { side: "server" | "client"; clientId?: number },
) => void;
