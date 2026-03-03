import express from "express";
import bodyParser from "body-parser";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { config as dotenvConfig } from "dotenv";
dotenvConfig();
import { session } from "./middleware/index.js";
import { logging } from "diegos-fly-logger/index.mjs";
import { proxy } from "./controllers/index.js";
import { isHealthy } from "./helpers/redis.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "public");
const distDir = path.join(publicDir, "dist");
const hasBuild = fs.existsSync(path.join(distDir, "index.html"));

const app = express();

// Serve only the built frontend at /. Never serve public/index.html (it references .ts and breaks when served by Express).
app.get("/", (req, res) => {
  if (!hasBuild) {
    res.status(503).set("Content-Type", "text/plain").send(
      "Frontend not built. Run `pnpm build` and try again.",
    );
    return;
  }
  res.sendFile("index.html", { root: distDir });
});
if (hasBuild) {
  app.use(express.static(distDir));
}
app.use(express.static(publicDir));

app.use(session);

app.use(logging);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/healthcheck", (req, res) => {
  res.status(200).send("OK");
});

app.get("/redis-healthcheck", async (req, res) => {
  if (await isHealthy()) {
    res.status(200).send("OK");
  } else {
    res.status(500).send("Redis is not healthy");
  }
});

app.all("/api/proxy/:url(*)", async (req, res) => {
  res.setHeader("Cache-Control", "public, max-age=3600");
  return proxy(req, res);
});

export default app;

