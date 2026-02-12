import type net from "node:net";
import type {
	ClientInitializationOptions,
	NetworkLayer,
	NetworkLayerState,
} from "@/types";

export class ElectraClient {
	private networkingLayer: NetworkLayer;
	constructor(
		options: ClientInitializationOptions & { networkingLayer: NetworkLayer },
	) {
		this.networkingLayer = options.networkingLayer;
		options.networkingLayer.startClient(options);
	}
	public send(data: Uint8Array): void {
		this.networkingLayer.send(data);
	}

	public stop(): void {
		this.networkingLayer.stop();
	}

	public getState(): NetworkLayerState {
		return this.networkingLayer.getState();
	}
}
