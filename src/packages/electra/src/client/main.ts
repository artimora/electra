import type { ClientInitializationOptions, NetworkLayer } from "@/layers";

export class ElectraClient {
	constructor(
		options: ClientInitializationOptions & { networkingLayer: NetworkLayer },
	) {
		console.log("client", options.networkingLayer);
	}
}
