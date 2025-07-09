import mongoose from "mongoose";

export class BaseRepository<T> {
  protected model: any;

  constructor(model: any) {
    this.model = model;
  }

  async findById(id: string, session?: mongoose.ClientSession) {
    return this.model.findById(id).session(session).exec();
  }

  async findOne(query: Record<string, any>, session?: mongoose.ClientSession) {
    return this.model.findOne(query).session(session).exec();
  }

  async findAll(
    query: Record<string, any> = {},
    projection?: Record<string, any>
  ) {
    return this.model.find(query, projection);
  }

  async create(data: Partial<T>, session?: mongoose.ClientSession) {
    const doc = new this.model(data);
    return session ? doc.save({ session }) : doc.save();
  }

  async update(id: string, data: Partial<T>) {
    return this.model.findByIdAndUpdate(id, data, { new: true });
  }

  async delete(id: string) {
    return this.model.findByIdAndDelete(id);
  }

  async deleteMany(
    query: Record<string, any>,
    session?: mongoose.ClientSession
  ) {
    return this.model.deleteMany(query).session(session);
  }
}
