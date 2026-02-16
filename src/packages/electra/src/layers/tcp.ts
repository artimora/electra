import net from "node:net";
import type {
	ClientInitializationOptions,
	NetworkLayer,
	NetworkLayerState,
	RawMessageHandler,
	ServerInitializationOptions,
} from "@/types";

export class TCPNetworkingLayer implements NetworkLayer {
	private currentState: NetworkLayerState = "disconnected";

	// server
	private server?: net.Server | undefined;
	private clients: net.Socket[] = [];

	// client
	private socket?: net.Socket | undefined;
	private clientOptions?: ClientInitializationOptions | undefined;
	private reconnectTimer?: NodeJS.Timeout | undefined;
	private reconnectAttempts = 0;
	private shouldReconnect = false;

	// generic
	private sendQueue: Uint8Array[] = [];

	// inbound "push up"
	private onMessage?: RawMessageHandler | undefined;

	// per-socket receive buffers (TCP is a stream)
	private serverRecv = new WeakMap<net.Socket, Buffer>();
	private clientRecv: Buffer = Buffer.alloc(0);

	public setOnMessage(handler?: RawMessageHandler): void {
		this.onMessage = handler;
	}

	public getState(): NetworkLayerState {
		return this.currentState;
	}

	public startServer(options: ServerInitializationOptions): void {
		if (this.currentState !== "disconnected") {
			throw new Error("Cannot start server: already active.");
		}

		this.server = net.createServer((socket) => {
			this.clients.push(socket);
			this.serverRecv.set(socket, Buffer.alloc(0));

			socket.on("data", (chunk: Buffer | string) => {
				const clientId = this.clients.indexOf(socket) + 1;
				this.handleServerData(socket, chunk, clientId);
			});

			socket.on("close", () => {
				this.clients = this.clients.filter((c) => c !== socket);
				// WeakMap cleans itself up
			});

			socket.on("error", (err) => {
				console.error("Client socket error:", err);
			});
		});

		this.server.listen(options.port, () => {
			this.currentState = "server";
			console.log(`Server listening on port ${options.port}`);

			for (const data of this.sendQueue) this.send(data);
			this.sendQueue = [];
		});

		this.server.on("error", (err) => {
			console.error("Server error:", err);
		});
	}

	public startClient(options: ClientInitializationOptions): void {
		if (this.currentState !== "disconnected") {
			throw new Error("Cannot start client: already active.");
		}

		this.clientOptions = options;
		this.shouldReconnect = Boolean(options.autoReconnect);
		this.reconnectAttempts = 0;
		this.clearReconnectTimer();
		this.connectClient(options);
	}

	public send(data: Uint8Array): void {
		const framed = this.frame(data);

		if (this.currentState === "server") {
			for (const client of this.clients) client.write(framed);
			return;
		}

		if (this.currentState === "client" && this.socket) {
			this.socket.write(framed);
			return;
		}

		if (this.currentState === "disconnected") {
			this.sendQueue.push(data); // store unframed, frame later
			return;
		}

		throw new Error("Cannot send.");
	}

	public sendToClient(clientId: number, data: Uint8Array): void {
		if (this.currentState !== "server") {
			throw new Error("sendToClient only valid in server mode.");
		}

		const index = clientId - 1;
		if (index < 0 || index >= this.clients.length) {
			throw new Error("Invalid client ID");
		}

		this.clients[index]?.write(this.frame(data));
	}

	public getClients(): net.Socket[] {
		return this.clients;
	}

	public stop(): void {
		this.shouldReconnect = false;
		this.clearReconnectTimer();
		this.clientOptions = undefined;
		this.reconnectAttempts = 0;

		if (this.currentState === "server") {
			for (const client of this.clients) client.destroy();
			this.server?.close();
		}

		if (this.currentState === "client") {
			this.socket?.destroy();
		}

		this.clients = [];
		this.server = undefined;
		this.socket = undefined;
		this.currentState = "disconnected";
		this.clientRecv = Buffer.alloc(0);
		this.onMessage = undefined;
	}

	private connectClient(options: ClientInitializationOptions): void {
		this.socket = new net.Socket();
		this.clientRecv = Buffer.alloc(0);

		this.socket.connect(options.port, options.host, () => {
			this.currentState = "client";
			this.reconnectAttempts = 0;
			console.log(`Connected to ${options.host}:${options.port}`);

			for (const data of this.sendQueue) this.send(data);
			this.sendQueue = [];
		});

		this.socket.on("data", (chunk: Buffer | string) => {
			this.handleClientData(chunk);
		});

		this.socket.on("close", () => {
			this.currentState = "disconnected";
			this.socket = undefined;
			this.clientRecv = Buffer.alloc(0);
			this.scheduleReconnect();
		});

		this.socket.on("error", (err) => {
			console.error("Client error:", err);
			if (this.currentState !== "client") {
				this.scheduleReconnect();
			}
		});
	}

	private scheduleReconnect(): void {
		const options = this.clientOptions;
		const config = options?.autoReconnect;
		if (!this.shouldReconnect || !config || !options) return;
		if (this.reconnectTimer) return;

		const delayMs = Math.max(0, config.delayMs ?? 1000);
		if (
			config.maxAttempts !== undefined &&
			this.reconnectAttempts >= config.maxAttempts
		) {
			return;
		}

		this.reconnectAttempts += 1;
		this.reconnectTimer = setTimeout(() => {
			this.reconnectTimer = undefined;
			if (!this.shouldReconnect || this.currentState !== "disconnected") return;
			if (!this.clientOptions) return;
			this.connectClient(this.clientOptions);
		}, delayMs);
	}

	private clearReconnectTimer(): void {
		if (!this.reconnectTimer) return;
		clearTimeout(this.reconnectTimer);
		this.reconnectTimer = undefined;
	}

	// ---- framing ----

	private frame(payload: Uint8Array): Buffer {
		const len = payload.byteLength;
		const buf = Buffer.allocUnsafe(4 + len);
		buf.writeUInt32BE(len, 0);
		Buffer.from(payload).copy(buf, 4);
		return buf;
	}

	private drainFrames(
		buffer: Buffer,
		emit: (payload: Uint8Array) => void,
	): Buffer {
		// Keep pulling: [4-byte length][payload]
		let offset = 0;

		while (buffer.length - offset >= 4) {
			const msgLen = buffer.readUInt32BE(offset);
			if (msgLen < 0) throw new Error("Invalid frame length");

			const available = buffer.length - offset - 4;
			if (available < msgLen) break; // wait for more data

			const start = offset + 4;
			const end = start + msgLen;

			const payload = buffer.subarray(start, end);
			emit(new Uint8Array(payload));

			offset = end;
		}

		return offset === 0 ? buffer : buffer.subarray(offset);
	}

	private handleServerData(
		socket: net.Socket,
		chunk: Buffer | string,
		clientId: number,
	) {
		const buf = typeof chunk === "string" ? Buffer.from(chunk, "utf8") : chunk;

		const prev = this.serverRecv.get(socket) ?? Buffer.alloc(0);
		const next = Buffer.concat([prev, buf]);

		const remaining = this.drainFrames(next, (payload) => {
			this.onMessage?.(payload, { side: "server", clientId });
		});

		this.serverRecv.set(socket, remaining);
	}

	private handleClientData(chunk: Buffer | string) {
		const buf = typeof chunk === "string" ? Buffer.from(chunk, "utf8") : chunk;

		this.clientRecv = Buffer.concat([this.clientRecv, buf]);

		this.clientRecv = this.drainFrames(this.clientRecv, (payload) => {
			this.onMessage?.(payload, { side: "client" });
		});
	}
}
