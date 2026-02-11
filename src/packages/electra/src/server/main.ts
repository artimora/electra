import type { NetworkLayer, ServerInitializationOptions } from "@/layers";

export class ElectraServer {
	constructor(
		options: ServerInitializationOptions & { networkingLayer: NetworkLayer },
	) {
		console.log("server", options.networkingLayer);
	}
}
