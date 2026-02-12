import net from "node:net";
import type {
	ClientInitializationOptions,
	NetworkLayer,
	NetworkLayerState,
	ServerInitializationOptions,
} from "@/types";

export class TCPNetworkingLayer implements NetworkLayer {
	private currentState: NetworkLayerState = "disconnected";

	// server
	private server?: net.Server | undefined;
	private clients: net.Socket[] = [];

	// client
	private socket?: net.Socket | undefined;

	// generic
	private sendQueue: Uint8Array[] = [];

	getState(): NetworkLayerState {
		return this.currentState;
	}

	startServer(options: ServerInitializationOptions): void {
		if (this.currentState !== "disconnected") {
			throw new Error("Cannot start server: already active.");
		}

		this.server = net.createServer((socket) => {
			this.clients.push(socket);

			socket.on("data", (data) => {
				console.log("Server received:", data);
			});

			socket.on("close", () => {
				this.clients = this.clients.filter((c) => c !== socket);
			});

			socket.on("error", (err) => {
				console.error("Client socket error:", err);
			});
		});

		this.server.listen(options.port, () => {
			this.currentState = "server";
			console.log(`Server listening on port ${options.port}`);

			for (const data of this.sendQueue) {
				this.send(data);
			}
			this.sendQueue = [];
		});

		this.server.on("error", (err) => {
			console.error("Server error:", err);
		});
	}

	startClient(options: ClientInitializationOptions): void {
		if (this.currentState !== "disconnected") {
			throw new Error("Cannot start client: already active.");
		}

		this.socket = new net.Socket();

		this.socket.connect(options.port, options.host, () => {
			this.currentState = "client";
			console.log(`Connected to ${options.host}:${options.port}`);

			for (const data of this.sendQueue) {
				this.send(data);
			}
			this.sendQueue = [];
		});

		this.socket.on("data", (data) => {
			console.log("Client received:", data);
		});

		this.socket.on("close", () => {
			this.currentState = "disconnected";
		});

		this.socket.on("error", (err) => {
			console.error("Client error:", err);
		});
	}

	send(data: Uint8Array): void {
		if (this.currentState === "server") {
			for (const client of this.clients) {
				client.write(data);
			}
			return;
		}

		if (this.currentState === "client" && this.socket) {
			this.socket.write(data);
			return;
		}

		if (this.currentState === "disconnected") {
			this.sendQueue.push(data);
			return;
		}

		throw new Error("Cannot send.");
	}

	sendToClient(clientId: number, data: Uint8Array): void {
		if (this.currentState !== "server") {
			throw new Error("sendToClient only valid in server mode.");
		}

		const index = clientId - 1;

		if (index < 0 || index >= this.clients.length) {
			throw new Error("Invalid client ID");
		}

		this.clients[index]?.write(data);
	}

	getClients(): net.Socket[] {
		return this.clients;
	}

	stop(): void {
		if (this.currentState === "server") {
			for (const client of this.clients) {
				client.destroy();
			}
			this.server?.close();
		}

		if (this.currentState === "client") {
			this.socket?.destroy();
		}

		this.clients = [];
		this.server = undefined;
		this.socket = undefined;
		this.currentState = "disconnected";
	}
}
