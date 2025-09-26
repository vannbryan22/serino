import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "./entity/User";
import { Treasure } from "./entity/Treasure";
import { MoneyValue } from "./entity/MoneyValue";

const { DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE } = process.env;

export const AppDataSource = new DataSource({
  type: "mysql",
  host: DB_HOST,
  port: +DB_PORT || 3306,
  username: DB_USERNAME,
  password: DB_PASSWORD,
  database: DB_DATABASE,
  synchronize: false,
  logging: true,
  subscribers: [],
  entities: [User, Treasure, MoneyValue],
  migrations: ["build/migration/*.js"],
});
