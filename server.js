import express from "express";
import bodyParser from "body-parser";
import { config as dotenvConfig } from "dotenv";
dotenvConfig();
import { session } from "./middleware/index.js";
import { logging } from 'diegos-fly-logger/index.mjs';
import { proxy } from "./controllers/index.js";
import { isHealthy } from "./helpers/redis.js";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static("public")); // serve static files

app.get("/", (req, res) => {
  // built by vite
  res.sendFile("/dist/index.html", { root: __dirname });
});

// anonymous session
app.use(session);

// logging
app.use(logging);

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

app.get("/healthcheck", (req, res) => {
  res.status(200).send("OK");
});

// redis healthcheck endpoint
app.get("/redis-healthcheck", async (req, res) => {
  if (await isHealthy()) {
    res.status(200).send("OK");
  } else {
    res.status(500).send("Redis is not healthy");
  }
});

app.all("/api/proxy/:url(*)", async (req, res) => {
  // let browsers cache response for 1h
  res.setHeader("Cache-Control", "public, max-age=3600");
  return proxy(req, res);
});

app.listen(port, () =>
  console.log(`app listening on port http://localhost:${port}`)
);
