import type { Message } from "./types";

// realistically this should probally be packed better lol

export function serialize(message: Message): Uint8Array {
	const json = JSON.stringify(message);
	return new TextEncoder().encode(json);
}

export function deserialize(data: Uint8Array): Message {
	const json = new TextDecoder().decode(data);
	return JSON.parse(json);
}
