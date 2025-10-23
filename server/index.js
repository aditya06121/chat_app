import "dotenv/config";
import { server } from "./app.js";
import dbConnect from "./db.js";
const port = process.env.PORT || 3000;
try {
  await dbConnect();
  server.on("Error", (err) => {
    console.err(`Failed to start express`, err);
  });
  server.listen(port, () => {
    console.log("server is running on port: ", port);
  });
} catch {
  console.log(`Server failed`);
  throw new Error();
}
