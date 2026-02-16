type ActionCallback<T> = (value: T) => void;

export class Action<T> {
	private callbacks = new Set<ActionCallback<T>>();

	public add(callback: ActionCallback<T>): void {
		this.callbacks.add(callback);
	}

	public remove(callback: ActionCallback<T>): void {
		this.callbacks.delete(callback);
	}

	public invoke(value: T): void {
		for (const callback of this.callbacks) {
			callback(value);
		}
	}
}
