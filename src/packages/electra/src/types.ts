import type net from "node:net";
export type NetworkLayerState = "server" | "client" | "disconnected";

export type HandlerSide = "server" | "client";

export interface NetworkLayer {
	getState(): NetworkLayerState;
	send(data: Uint8Array): void;
	stop(): void;

	startServer(options: ServerInitializationOptions): void;
	startClient(options: ClientInitializationOptions): void;

	sendToClient(clientId: number, data: Uint8Array): void;
	getClients(): net.Socket[];

	setOnMessage(handler?: RawMessageHandler): void;
	setOnConnection(handler?: ConnectionHandler): void;
	setOnDisconnect(handler?: ConnectionHandler): void;
}

export interface BaseInitializationOptions {
	port: number;
	tickDelay?: number;
	functionTimeout?: number;
	functionHandler?: FunctionHandler;
}

export type ServerInitializationOptions = BaseInitializationOptions & {
	port: number;
};

export type ClientInitializationOptions = BaseInitializationOptions & {
	host: string;
	autoReconnect?: {
		delayMs?: number;
		maxAttempts?: number;
	};
};

export type Message = {
	id: `${string}:${string}`;
	values: { [key: string]: string };
};

export type FunctionSenderData = {
	targetSide: HandlerSide;
	messageContents: Message;
	targetClient: number;
};

export type FunctionHandler = {
	setOptions(newOptions: BaseInitializationOptions): void;
	onMessage(client: number, message: Message): void;
	registerMessageSender(sender: (data: FunctionSenderData) => void): void;
	callFunction(
		functionName: string,
		args: { [key: string]: string },
	): Promise<{ [key: string]: string }>;
	registerFunction(
		functionName: string,
		func: FunctionCallback,
		forceSet?: boolean,
	): void;
};

export type FunctionCallback = (args: {
	[key: string]: string;
}) => PotentialPromise<{
	[key: string]: string;
}>;

export type PotentialPromise<T> = T | Promise<T>;

export type RawMessageHandler = (
	payload: Uint8Array,
	meta: HandlerMetaData,
) => void;

export type ConnectionHandler = (meta: HandlerMetaData) => void;

export type HandlerMetaData = {
	side: HandlerSide;
	clientId?: number | undefined;
};
