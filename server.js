import express from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import { config as dotenvConfig } from "dotenv";
dotenvConfig();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static("public"));

// Define a custom morgan format that logs request IP and request payload
morgan.token("payload", (req, res) => {
  return JSON.stringify(req.body);
});
const logFormat = `remote-addr\tresponse-time(ms)\tmethod\turl\tstatus\tpayload\treq[content-type]\treq[user-agent]
:remote-addr\t:response-time ms\t:method\t:url\t:status\t:payload\t:req[content-type]\t:req[user-agent]`;

app.use(express.static("public"));
app.use(morgan(logFormat)); // logs
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

app.listen(port, () =>
  console.log(`app listening on port http://localhost:${port}`)
);
