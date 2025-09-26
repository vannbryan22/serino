import "dotenv/config";
import { AppDataSource } from "./data-source";
import { Request, Response } from "express";
import * as express from "express";
import "reflect-metadata";
import treasureRoutes from "./treasure/treasure.routes";

AppDataSource.initialize()
  .then(async () => {
    const app = express();
    const port = 3000;

    app.use(express.json());

    app.get("/", (_req: Request, res: Response) => {
      res.send("Hello World!");
    });

    app.use("/treasures", treasureRoutes);

    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
  })
  .catch((error) => console.log(error));
