import { randomUUID } from "node:crypto";
import type {
	BaseInitializationOptions,
	FunctionCallback,
	FunctionHandler,
	FunctionSenderData,
	HandlerSide,
	Message,
} from "@/types";

type PendingResult = {
	resolve: (value: { [key: string]: string }) => void;
	reject: (reason?: unknown) => void;
	timeout: Timer;
};

export class GenericFunctionHandler implements FunctionHandler {
	private messageSender?: ((data: FunctionSenderData) => void) | undefined;
	private options: BaseInitializationOptions = {
		port: 8080,
		tickDelay: 100,
		functionTimeout: 8000,
	};

	private readonly functions = new Map<string, FunctionCallback>();
	private readonly returnQueue = new Map<string, PendingResult>();

	public constructor(private readonly side: HandlerSide) {}

	public setOptions(newOptions: BaseInitializationOptions): void {
		this.options = {
			...this.options,
			...newOptions,
		};
	}

	public onMessage(client: number, message: Message): void {
		if (message.id === "artimora:function_call") {
			queueMicrotask(async () => {
				await this.handleFunctionCall(client, message);
			});
			return;
		}

		if (message.id !== "artimora:function_results") {
			return;
		}

		const returnId = message.values["artimora:function_return_id"];
		if (!returnId) {
			return;
		}

		const pending = this.returnQueue.get(returnId);
		if (!pending) {
			return;
		}

		clearTimeout(pending.timeout);
		this.returnQueue.delete(returnId);
		pending.resolve({ ...message.values });
	}

	public registerMessageSender(
		sender: (data: FunctionSenderData) => void,
	): void {
		this.messageSender = sender;
	}

	public callFunction(
		functionName: string,
		args: { [key: string]: string },
	): Promise<{ [key: string]: string }> {
		const payload = { ...args };

		const targetClient = Number.parseInt(
			payload["artimora:target_client"] ?? "-1",
			10,
		);
		const returnId = randomUUID();

		payload["artimora:function_name"] = functionName;
		payload["artimora:function_return_id"] = returnId;

		const toSend: Message = {
			id: "artimora:function_call",
			values: payload,
		};

		const targetSide: HandlerSide =
			this.side === "client" ? "server" : "client";

		return new Promise((resolve, reject) => {
			const timeoutMs = Math.max(0, this.options.functionTimeout ?? 8000);

			const timeout = setTimeout(() => {
				if (!this.returnQueue.has(returnId)) {
					return;
				}

				this.returnQueue.delete(returnId);
				console.warn(
					`Function call ${returnId} timed out after ${timeoutMs / 1000}s`,
				);
				resolve({ "artimora:error": "timeout" });
			}, timeoutMs);

			this.returnQueue.set(returnId, {
				resolve,
				reject,
				timeout,
			});

			try {
				this.messageSender?.({
					targetSide,
					messageContents: toSend,
					targetClient: Number.isNaN(targetClient) ? -1 : targetClient,
				});
			} catch (error) {
				const pending = this.returnQueue.get(returnId);
				if (pending) {
					clearTimeout(pending.timeout);
				}
				this.returnQueue.delete(returnId);
				reject(error);
			}
		});
	}

	public registerFunction(
		functionName: string,
		func: FunctionCallback,
		forceSet = false,
	): void {
		if (!forceSet && this.functions.has(functionName)) {
			console.error(`Function '${functionName}' is already registered`);
			return;
		}

		this.functions.set(functionName, func);
	}

	private async handleFunctionCall(
		client: number,
		message: Message,
	): Promise<void> {
		const targetSide: HandlerSide =
			this.side === "client" ? "server" : "client";

		const functionName = message.values["artimora:function_name"];
		const functionReturnId = message.values["artimora:function_return_id"];
		if (!functionName || !functionReturnId) {
			return;
		}

		const func = this.functions.get(functionName);
		if (!func) {
			console.error(`Function '${functionName}' not found`);

			this.messageSender?.({
				targetSide,
				targetClient: client,
				messageContents: {
					id: "artimora:function_results",
					values: {
						"artimora:function_name": functionName,
						"artimora:function_return_id": functionReturnId,
						"artimora:error": "not_found",
					},
				},
			});
			return;
		}

		let results: { [key: string]: string };
		try {
			results = await func({ ...message.values });
		} catch (error) {
			console.error(`Function '${functionName}' failed:`, error);
			results = {
				"artimora:error": "handler_error",
			};
		}

		results["artimora:function_name"] = functionName;
		results["artimora:function_return_id"] = functionReturnId;
		if (!("artimora:error" in results)) {
			results["artimora:error"] = "none";
		}

		this.messageSender?.({
			targetSide,
			targetClient: client,
			messageContents: {
				id: "artimora:function_results",
				values: results,
			},
		});
	}
}
