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
}
