import { bold, yellow } from "https://deno.land/std@0.118.0/fmt/colors.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import { Application, Router } from "https://deno.land/x/oak/mod.ts";
import { Room } from "./room.ts";

const app = new Application();
const router = new Router();

const rooms = new Map<string, Room>();

router.get("/rooms", async (context) => {
  const roomId = context.request.url.searchParams.get("roomId");
  const userId = context.request.url.searchParams.get("userId");

  if (!roomId || !userId) {
    return; // TODO: WebSocektの例外処理
  }

  const room = rooms.get(roomId) || new Room(roomId);
  rooms.set(roomId, room);

  const ws = await context.upgrade();
  room.addSocket(ws, userId);
});

app.use(oakCors());
app.use(router.routes());
app.use(router.allowedMethods());

app.addEventListener("listen", ({ hostname, port, serverType }) => {
  console.log(bold(`Start listening on: ${yellow(`${hostname}:${port}`)}`));
  console.log(bold(`using HTTP server: ${yellow(serverType)}`));
});

await app.listen({
  port: parseInt(Deno.env.get("PORT") || "8000", 10),
});
console.log(bold("Finished."));
