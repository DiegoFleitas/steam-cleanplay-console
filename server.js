const port = process.env.PORT || 3000;
import app from "./app.js";

app.listen(port, () => {
  console.log(`app listening on port http://localhost:${port}`);
});
