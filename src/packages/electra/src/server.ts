import type net from "node:net";
import type {
	Message,
	NetworkLayer,
	NetworkLayerState,
	ServerInitializationOptions,
} from "@/types";
import { deserialize, serialize } from "./messages";
import { Action } from "./util";

export class ElectraServer {
	private networkingLayer: NetworkLayer;
	public onMessage: Action<{ message: Message; clientId: number }>;

	constructor(
		options: ServerInitializationOptions & { networkingLayer: NetworkLayer },
	) {
		this.networkingLayer = options.networkingLayer;
		this.networkingLayer.startServer(options);

		this.onMessage = new Action<{ message: Message; clientId: number }>();

		this.networkingLayer.setOnMessage((payload, meta) => {
			this.onMessage.invoke({
				message: deserialize(payload),
				// biome-ignore lint/style/noNonNullAssertion: we are 100% sure we're on the server in this code lol
				clientId: meta.clientId!,
			});
		});
	}

	public sendToClient(clientId: number, message: Message): void {
		this.networkingLayer.sendToClient(clientId, serialize(message));
	}

	public sendToAllClients(message: Message): void {
		this.networkingLayer.send(serialize(message));
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
