import type net from "node:net";
import type {
	HandlerMetaData,
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
	public onClientConnect: Action<number>;
	public onClientDisconnect: Action<number>;

	constructor(
		options: ServerInitializationOptions & { networkingLayer: NetworkLayer },
	) {
		this.networkingLayer = options.networkingLayer;
		this.networkingLayer.startServer(options);

		this.onMessage = new Action<{ message: Message; clientId: number }>();
		this.onClientConnect = new Action<number>();
		this.onClientDisconnect = new Action<number>();

		this.networkingLayer.setOnMessage((payload, meta) => {
			this.onMessage.invoke({
				message: deserialize(payload),
				// biome-ignore lint/style/noNonNullAssertion: we are 100% sure we're on the server in this code lol
				clientId: meta.clientId!,
			});
		});

		this.networkingLayer.setOnConnection((meta) => {
			// biome-ignore lint/style/noNonNullAssertion: we are 100% sure we're on the server in this code lol
			this.onClientConnect.invoke(meta.clientId!);
		});

		this.networkingLayer.setOnDisconnect((meta) => {
			// biome-ignore lint/style/noNonNullAssertion: we are 100% sure we're on the server in this code lol
			this.onClientDisconnect.invoke(meta.clientId!);
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
