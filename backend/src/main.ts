import { bold, yellow } from "https://deno.land/std@0.118.0/fmt/colors.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import { Application, Router } from "https://deno.land/x/oak/mod.ts";

const app = new Application();
const router = new Router();

const sockets = new Set<WebSocket>();

router.get("/random", async (context) => {
  const socket = await context.upgrade();
  socket.addEventListener("open", () => {
    sockets.add(socket);
  });
  socket.addEventListener("close", () => {
    sockets.delete(socket);
  });
  socket.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);
    if (data.type === "DRAW") {
      sockets.forEach((s) => {
        s.send(JSON.stringify({ type: "DRAWED", payload: data.payload }));
      });
    }
  });
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
