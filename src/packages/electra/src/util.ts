type ActionCallback<T> = T extends void ? () => void : (value: T) => void;

export class Action<T = void> {
	private callbacks = new Set<ActionCallback<T>>();

	public add(callback: ActionCallback<T>): void {
		this.callbacks.add(callback);
	}

	public remove(callback: ActionCallback<T>): void {
		this.callbacks.delete(callback);
	}

	public invoke(...args: T extends void ? [] : [value: T]): void {
		for (const callback of this.callbacks) {
			(callback as any)(...args);
		}
	}
}
