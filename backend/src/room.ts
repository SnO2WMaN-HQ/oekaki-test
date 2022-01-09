export class Room {
  private roomId: string;
  private sockets: Set<WebSocket>;

  private lines: { from: [number, number]; to: [number, number]; }[];
  private cursors: Map<string, { updatedAt: number; point: [number, number]; }>;
  private participants: Map<string, { name: string; }>;

  constructor(roomId: string) {
    this.roomId = roomId;
    this.sockets = new Set();

    this.lines = [];
    this.cursors = new Map();
    this.participants = new Map();
  }

  private handleDraw(payload: { from: [number, number]; to: [number, number]; }) {
  }

  public addSocket(ws: WebSocket, userId: string) {
    if (!this.participants.get(userId)) {
      this.participants.set(userId, { name: "Anonymous" });
    }

    ws.addEventListener("open", () => {
      this.sockets.add(ws);
      const payload = {
        lines: this.lines,
        participants: [...this.participants.entries()].map(([id, { name }]) => ({ id, name })),
      };
      ws.send(JSON.stringify({ type: "INIT_SYNC", payload: payload }));
    });

    ws.addEventListener("close", () => {
      this.sockets.delete(ws);
    });

    ws.addEventListener("message", (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "CURSOR") {
        const now = Date.now();
        this.cursors.set(data.payload.uid, { updatedAt: now, point: data.payload.point });
        const payload = [...this.cursors.entries()]
          .map(([uid, { point, updatedAt }]) => ({ uid, point, updatedAt }));
        this.sockets.forEach((iws) => {
          iws.send(JSON.stringify({ type: "SYNC_CURSORS", payload: payload }));
        });
      } else if (data.type === "DRAW") {
        this.lines.push(data.payload);
        const payload = data.payload;
        this.sockets.forEach((iws) => {
          iws.send(JSON.stringify({ type: "SYNC_DRAWING", payload: payload }));
        });
      } else if (data.type === "RENAME") {
        this.participants.set(data.payload["id"], {
          ...this.participants.get(data.payload["id"]),
          name: data.payload["name"],
        });
        const payload = { participants: [...this.participants.entries()].map(([id, { name }]) => ({ id, name })) };
        this.sockets.forEach((iws) => {
          iws.send(JSON.stringify({ type: "SYNC_PARTICIPANTS", payload: payload }));
        });
      }
    });
  }
}
