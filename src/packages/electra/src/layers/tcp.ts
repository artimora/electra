import type {
	ClientInitializationOptions,
	NetworkLayer,
	ServerInitializationOptions,
} from ".";

export class TCPNetworkingLayer implements NetworkLayer {
	startClient(server: ServerInitializationOptions): Promise<void> {
		throw new Error("Method not implemented.");
	}
	startServer(client: ClientInitializationOptions): Promise<void> {
		throw new Error("Method not implemented.");
	}
	send(data: Uint8Array): Promise<void> {
		throw new Error("Method not implemented.");
	}
	sendToClient(clientId: number, data: Uint8Array): Promise<void> {
		throw new Error("Method not implemented.");
	}
	getClients(): number[] {
		throw new Error("Method not implemented.");
	}
}
