# electra

> simple (and thin) message based networking library

> a pleiades sister library

## Example

### Server

```typescript
const server = new ElectraServer({
  networkingLayer: new TCPNetworkingLayer(),
  port: 8080,
});
```

### Client

```typescript
const client = new ElectraClient({
  host: "127.0.0.1",
  port: 8080,
  networkingLayer: new TCPNetworkingLayer(),
  autoReconnect: { delayMs: 2000, maxAttempts: 10 },
});

client.send({
  id: "testing:time",
  values: {
    time: `${Date.now()}`,
  },
});
```
