import type net from "node:net";
import type {
	NetworkLayer,
	NetworkLayerState,
	ServerInitializationOptions,
} from "@/types";

export class ElectraServer {
	private networkingLayer: NetworkLayer;

	constructor(
		options: ServerInitializationOptions & { networkingLayer: NetworkLayer },
	) {
		this.networkingLayer = options.networkingLayer;
		this.networkingLayer.startServer(options);
	}

	public sendToClient(clientId: number, data: Uint8Array): void {
		this.networkingLayer.sendToClient(clientId, data);
	}

	public sendToAllClients(data: Uint8Array): void {
		this.networkingLayer.send(data);
	}

	public getClients(): net.Socket[] {
		return this.networkingLayer.getClients();
	}

	public stop(): void {
		this.networkingLayer.stop();
	}

	public getState(): NetworkLayerState {
		return this.networkingLayer.getState();
	}
}
