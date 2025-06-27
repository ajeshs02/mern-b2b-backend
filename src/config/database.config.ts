import mongoose from "mongoose";
import { config } from "./app.config";

const connectDatabase = async () => {
  try {
    console.log("MONGO_URI from env : ", config.MONGO_URI);
    await mongoose.connect(config.MONGO_URI);
    console.log("Connected to Mongo database");
  } catch (error) {
    console.log("Error connecting to Mongo database");
    process.exit(1);
  }
};

export default connectDatabase;
