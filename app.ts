import express from "express";
import bodyParser from "body-parser";
import { config as dotenvConfig } from "dotenv";
dotenvConfig();
import { session } from "./middleware/index.js";
import { logging } from "diegos-fly-logger/index.mjs";
import { proxy } from "./controllers/index.js";
import { isHealthy } from "./helpers/redis.js";

const app = express();

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile("/dist/index.html", { root: __dirname });
});

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

