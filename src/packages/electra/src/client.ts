import type {
	ClientInitializationOptions,
	HandlerMetaData,
	Message,
	NetworkLayer,
	NetworkLayerState,
} from "@/types";
import { deserialize, serialize } from "./messages";
import { Action } from "./util";

export class ElectraClient {
	private networkingLayer: NetworkLayer;
	public onMessage: Action<Message>;
	public onConnection: Action;
	public onDisconnect: Action;

	constructor(
		options: ClientInitializationOptions & { networkingLayer: NetworkLayer },
	) {
		this.networkingLayer = options.networkingLayer;
		options.networkingLayer.startClient(options);

		this.onMessage = new Action<Message>();
		this.onConnection = new Action();
		this.onDisconnect = new Action();

		this.networkingLayer.setOnMessage((payload) => {
			this.onMessage.invoke(deserialize(payload));
		});

		this.networkingLayer.setOnConnection(() => {
			this.onConnection.invoke();
		});

		this.networkingLayer.setOnDisconnect(() => {
			this.onDisconnect.invoke();
		});
	}

	public send(message: Message): void {
		this.networkingLayer.send(serialize(message));
	}

	public stop(): void {
		this.networkingLayer.stop();
	}

	public getState(): NetworkLayerState {
		return this.networkingLayer.getState();
	}
}
