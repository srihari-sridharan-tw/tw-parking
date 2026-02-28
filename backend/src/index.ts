import { buildApp } from "./app.js";
import { env } from "./config/env.js";

const app = buildApp();

app.listen({ port: env.PORT, host: "0.0.0.0" }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  console.log(`Slotify API running on http://0.0.0.0:${env.PORT}`);
});
