import type { Message } from "./types";

// realistically this should probally be packed better lol

export function serialize(message: Message): Uint8Array {
	const json = JSON.stringify(message);
	return new TextEncoder().encode(json);
}

export function deserialize(data: Uint8Array): Message {
	const json = new TextDecoder().decode(data);
	const parsed = JSON.parse(json) as Partial<Message>;

	return {
		id: (parsed.id ?? "artimora:invalid") as Message["id"],
		values: parsed.values ?? {},
	};
}
