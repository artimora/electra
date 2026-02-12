import type net from "node:net";
import type {
	BaseNetworkLayer,
	ClientInitializationOptions,
	ServerInitializationOptions,
} from "@/types";

export class WebSocketsNetworkingLayer implements BaseNetworkLayer {
	stop(): void {
		throw new Error("Method not implemented.");
	}
	getState(): "server" | "client" | "disconnected" {
		throw new Error("Method not implemented.");
	}
	startServer(server: ServerInitializationOptions): Promise<void> {
		throw new Error("Method not implemented.");
	}
	startClient(client: ClientInitializationOptions): Promise<void> {
		throw new Error("Method not implemented.");
	}
	send(data: Uint8Array): Promise<void> {
		throw new Error("Method not implemented.");
	}
	sendToClient(clientId: number, data: Uint8Array): Promise<void> {
		throw new Error("Method not implemented.");
	}
	getClients(): net.Socket[] {
		throw new Error("Method not implemented.");
	}
}
