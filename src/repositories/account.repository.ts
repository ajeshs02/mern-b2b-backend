import { BaseRepository } from "./base.repository";
import AccountModel from "../models/account.model";
import mongoose from "mongoose";

export class AccountRepository extends BaseRepository<typeof AccountModel> {
  constructor() {
    super(AccountModel);
  }

  /**
   * Find account by provider and providerId
   */
  async findByProvider(
    provider: string,
    providerId: string,
    session?: mongoose.ClientSession
  ) {
    return this.model.findOne({ provider, providerId }).session(session).exec();
  }

  /**
   * Create account
   */
  async createAccount(
    data: Record<string, any>,
    session?: mongoose.ClientSession
  ) {
    const account = new this.model(data);
    return account.save({ session });
  }
}
