import { DataSource } from "typeorm";
import { User } from "../models/User";
import { Message } from "../models/Message";

export const AppDataSource = new DataSource({
  type: "mysql",
  host: "localhost",
  port: 3307,
  username: "root",
  password: "Gamespring!@3232323",
  database: "gamespring",
  synchronize: true, // true for development, false for production
  logging: true, // true for development, false for production
  entities: [
    User,
    Message
  ],
  migrations: [
    // Add your migrations here
  ],
  subscribers: [
    // Add your subscribers here
  ]
});

export const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log("Database connected");
  } catch (error) {
    console.error("Database connection error", error);
    process.exit(1);
  }
};
