export interface NetworkLayer
	extends CommonNetworkLayer,
		ClientNetworkLayer,
		ServerNetworkLayer {}

export interface CommonNetworkLayer {
	send(data: Uint8Array): Promise<void>;
}

export interface ClientNetworkLayer {
	startClient(server: ClientInitializationOptions): Promise<void>;
}

export interface ServerNetworkLayer {
	startServer(server: ServerInitializationOptions): Promise<void>;
	sendToClient(clientId: number, data: Uint8Array): Promise<void>;
	getClients(): number[];
}

export type ServerInitializationOptions = {
	port: number;
};

export type ClientInitializationOptions = {
	host: string;
	port: number;
};
