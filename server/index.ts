import { createStore } from "./store.js";
import { createApp } from "./app.js";
const store = createStore();
const server = createApp(store).listen(
  Number(process.env.PORT ?? 4000),
  "0.0.0.0",
  () => console.log("BhuDrishti city service ready"),
);
function shutdown() {
  server.close(() => {
    store.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
