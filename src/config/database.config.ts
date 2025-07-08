import mongoose from "mongoose";
import { config } from "./app.config";
import logger from "../utils/logger";

const connectDatabase = async () => {
  try {
    await mongoose.connect(config.MONGO_URI);
    logger.info("Connected to Mongo database");
  } catch (error) {
    console.log("Error connecting to Mongo database");
    process.exit(1);
  }
};

export default connectDatabase;
