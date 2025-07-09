import { BaseRepository } from "./base.repository";
import UserModel from "../models/user.model";
import mongoose from "mongoose";

export class UserRepository extends BaseRepository<typeof UserModel> {
  constructor() {
    super(UserModel);
  }

  /**
   * Find user by ID and populate currentWorkspace
   */
  async findByIdWithWorkspace(userId: string) {
    return this.model
      .findById(userId)
      .populate("currentWorkspace")
      .select("-password")
      .exec();
  }

  /**
   * Save user document with optional session
   */
  async save(user: any, session?: mongoose.ClientSession) {
    return session ? user.save({ session }) : user.save();
  }
}
