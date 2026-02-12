import type { NetworkLayer, ServerInitializationOptions } from "@/types";

export class ElectraServer {
	constructor(
		options: ServerInitializationOptions & { networkingLayer: NetworkLayer },
	) {
		console.log("server", options.networkingLayer);
	}
}
