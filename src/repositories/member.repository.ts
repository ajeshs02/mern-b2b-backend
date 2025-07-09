import { BaseRepository } from "./base.repository";
import MemberModel from "../models/member.model";
import mongoose from "mongoose";

export class MemberRepository extends BaseRepository<typeof MemberModel> {
  constructor() {
    super(MemberModel);
  }

  /**
   * Find a member with populated role
   */
  async findMemberWithRole(userId: string, workspaceId: string) {
    return this.model.findOne({ userId, workspaceId }).populate("role");
  }

  /**
   * Check if user is already a member of a workspace
   */
  async isUserAlreadyMember(userId: string, workspaceId: string) {
    return this.model.findOne({ userId, workspaceId }).exec();
  }

  /**
   * Add a user to a workspace with given role
   */
  async addMemberToWorkspace(
    userId: string,
    workspaceId: string,
    roleId: string,
    session?: mongoose.ClientSession
  ) {
    const newMember = new this.model({
      userId,
      workspaceId,
      role: roleId,
    });
    return session ? newMember.save({ session }) : newMember.save();
  }

  /**
   * Find all members with user and role
   */
  async findMembersWithUserAndRole(workspaceId: string) {
    return this.model
      .find({ workspaceId })
      .populate("userId", "name email profilePicture -password")
      .populate("role", "name")
      .lean();
  }

  /**
   * Find all workspaces where the user is a member
   */
  async findWorkspacesForUser(userId: string) {
    return this.model
      .find({ userId })
      .populate("workspaceId")
      .select("-password")
      .lean();
  }
}
