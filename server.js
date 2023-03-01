const express = require("express");
const axios = require("./helpers/axios");
const bodyParser = require("body-parser");
const morgan = require("morgan");
require("dotenv").config();
const { getCacheValue, setCacheValue } = require("./helpers/redis");

const app = express();
const port = process.env.PORT || 3000;
const cacheTtl = process.env.CACHE_TTL || 60; // seconds

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

app.post("/api/poster", async (req, res) => {
  const API_KEY = process.env.API_KEY;
  const { title, year } = req.body;
  const cacheKey = `poster:${title}:${year}`;
  try {
    const cachedPoster = await getCacheValue(cacheKey);
    if (cachedPoster) {
      console.log("Poster found (cached)");
      return res.status(200).json({
        message: "Poster found",
        poster: cachedPoster,
      });
    }

    if (!title) {
      console.log("No movie title");
      return res.status(404).json({ message: "Movie not found" });
    }
    const response = await axios.get(
      `http://www.omdbapi.com/?t=${title}&y=${year}&apikey=${API_KEY}`
    );
    const { Poster } = response.data;
    await setCacheValue(cacheKey, Poster, cacheTtl);
    res.status(200).json({
      message: "Poster found",
      poster: Poster,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(port, () =>
  console.log(
    `app listening on port http://localhost:${port}`
  )
);
