import express from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import { config as dotenvConfig } from "dotenv";
dotenvConfig();
import { session, logging } from "./middleware/index.js";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static("public/dist")); // serve static files that vite built

// anonymous session
app.use(session);

// logging
app.use(logging);

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

app.listen(port, () =>
  console.log(`app listening on port http://localhost:${port}`)
);
