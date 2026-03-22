import type net from "node:net";
import type {
	FunctionHandler,
	Message,
	NetworkLayer,
	NetworkLayerState,
	ServerInitializationOptions,
} from "@/types";
import { deserialize, serialize } from "./messages";
import { GenericFunctionHandler } from "./functions";
import { Action } from "./util";

export class ElectraServer {
	private networkingLayer: NetworkLayer;
	private readonly functions: FunctionHandler;
	private readonly clientIdentities = new Map<number, string | null>();
	public onMessage: Action<{ message: Message; clientId: number }>;
	public onClientConnect: Action<number>;
	public onClientDisconnect: Action<number>;

	constructor(
		options: ServerInitializationOptions & { networkingLayer: NetworkLayer },
	) {
		const resolvedOptions: ServerInitializationOptions = {
			...options,
			tickDelay: options.tickDelay ?? 100,
			functionTimeout: options.functionTimeout ?? 8000,
		};

		this.networkingLayer = options.networkingLayer;
		this.functions = options.functionHandler ?? new GenericFunctionHandler("server");
		this.functions.setOptions(resolvedOptions);

		this.onMessage = new Action<{ message: Message; clientId: number }>();
		this.onClientConnect = new Action<number>();
		this.onClientDisconnect = new Action<number>();

		this.onClientConnect.add((clientId) => {
			this.clientIdentities.set(clientId, null);
			this.requestIdentity(clientId);
		});

		this.onClientDisconnect.add((clientId) => {
			this.clientIdentities.delete(clientId);
		});

		this.onMessage.add(({ message, clientId }) => {
			if (message.id !== "artimora:identity") {
				return;
			}

			const identity = message.values.id;
			if (!identity) {
				return;
			}

			this.clientIdentities.set(clientId, identity);
		});

		this.onMessage.add(({ message, clientId }) => {
			this.functions.onMessage(clientId, message);
		});

		this.functions.registerMessageSender((data) => {
			if (data.targetSide !== "client") {
				return;
			}

			this.sendToClient(data.targetClient, data.messageContents);
		});

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

		this.networkingLayer.startServer(options);
	}

	public sendToClient(clientId: number, message: Message): void {
		this.networkingLayer.sendToClient(clientId, serialize(message));
	}

	public sendToAllClients(message: Message): void {
		this.networkingLayer.send(serialize(message));
	}

	public getClientIdentities(): Array<string | null> {
		return this.getClients().map((_, i) => this.clientIdentities.get(i + 1) ?? null);
	}

	public getClientIdentity(clientId: number): string | null {
		return this.clientIdentities.get(clientId) ?? null;
	}

	public getClientId(clientIdentity: string): number {
		for (const [clientId, identity] of this.clientIdentities.entries()) {
			if (identity === clientIdentity) {
				return clientId;
			}
		}

		return -1;
	}

	public callFunction(
		functionName: string,
		targetClient: number,
		args: { [key: string]: string } = {},
	): Promise<{ [key: string]: string }> {
		return this.functions.callFunction(functionName, {
			...args,
			"artimora:target_client": `${targetClient}`,
		});
	}

	public registerFunction(
		functionName: string,
		func: (args: { [key: string]: string }) => { [key: string]: string },
		forceSet = false,
	): void {
		this.functions.registerFunction(functionName, func, forceSet);
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

	private requestIdentity(clientId: number): void {
		try {
			this.sendToClient(clientId, {
				id: "artimora:identity_request",
				values: {},
			});
		} catch {
			// client disconnected before request was sent
		}
	}
}
