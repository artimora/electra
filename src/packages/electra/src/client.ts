import { randomUUID } from "node:crypto";
import type {
	ClientInitializationOptions,
	FunctionHandler,
	Message,
	NetworkLayer,
	NetworkLayerState,
} from "@/types";
import { deserialize, serialize } from "./messages";
import { GenericFunctionHandler } from "./functions";
import { Action } from "./util";

export class ElectraClient {
	private networkingLayer: NetworkLayer;
	private readonly functions: FunctionHandler;
	private readonly clientId = randomUUID();
	public onMessage: Action<Message>;
	public onConnection: Action;
	public onDisconnect: Action;

	constructor(
		options: ClientInitializationOptions & { networkingLayer: NetworkLayer },
	) {
		const resolvedOptions: ClientInitializationOptions = {
			...options,
			tickDelay: options.tickDelay ?? 100,
			functionTimeout: options.functionTimeout ?? 8000,
		};

		this.networkingLayer = options.networkingLayer;
		this.functions = options.functionHandler ?? new GenericFunctionHandler("client");
		this.functions.setOptions(resolvedOptions);

		this.onMessage = new Action<Message>();
		this.onConnection = new Action();
		this.onDisconnect = new Action();

		this.onMessage.add((message) => {
			if (message.id !== "artimora:identity_request") {
				return;
			}

			this.send({
				id: "artimora:identity",
				values: {
					id: this.clientId,
				},
			});
		});

		this.onMessage.add((message) => {
			this.functions.onMessage(-1, message);
		});

		this.functions.registerMessageSender((data) => {
			if (data.targetSide !== "server") {
				return;
			}

			this.send(data.messageContents);
		});

		this.networkingLayer.setOnMessage((payload) => {
			this.onMessage.invoke(deserialize(payload));
		});

		this.networkingLayer.setOnConnection(() => {
			this.onConnection.invoke();
		});

		this.networkingLayer.setOnDisconnect(() => {
			this.onDisconnect.invoke();
		});

		this.networkingLayer.startClient(options);
	}

	public send(message: Message): void {
		this.networkingLayer.send(serialize(message));
	}

	public stop(): void {
		this.networkingLayer.stop();
	}

	public callFunction(
		functionName: string,
		args: { [key: string]: string } = {},
	): Promise<{ [key: string]: string }> {
		if (this.networkingLayer.getState() !== "disconnected") {
			return this.functions.callFunction(functionName, args);
		}

		console.error("Client is currently disconnected.");
		return Promise.resolve({ "artimora:error": "disconnected" });
	}

	public registerFunction(
		functionName: string,
		func: (args: { [key: string]: string }) => { [key: string]: string },
		forceSet = false,
	): void {
		this.functions.registerFunction(functionName, func, forceSet);
	}

	public getState(): NetworkLayerState {
		return this.networkingLayer.getState();
	}
}
