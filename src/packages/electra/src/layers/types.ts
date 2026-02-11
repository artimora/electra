export interface NetworkLayer {
	startClient(server: ServerInitializationOptions): Promise<void>;
	startServer(client: ClientInitializationOptions): Promise<void>;
}

export type ServerInitializationOptions = {
	port: number;
};

export type ClientInitializationOptions = {
	host: string;
	port: number;
};
