import { BaseRepository } from "./base.repository";
import WorkspaceModel from "../models/workspace.model";

export class WorkspaceRepository extends BaseRepository<typeof WorkspaceModel> {
  constructor() {
    super(WorkspaceModel);
  }

  /**
   * Find workspace by invite code
   */
  async findByInviteCode(inviteCode: string) {
    return this.model.findOne({ inviteCode });
  }

  /**
   * Find workspace by ID and include all members with their roles
   */
  async findWorkspaceWithMembers(workspaceId: string) {
    const workspace = await this.model.findById(workspaceId);
    if (!workspace) return null;

    const members = await this.model
      .model("Member") // Access Member model via Mongoose connection
      .find({ workspaceId })
      .populate("role");

    return {
      ...workspace.toObject(),
      members,
    };
  }

  /**
   * Delete workspace by ID using a session
   */
  async deleteWorkspaceWithSession(workspaceId: string, session: any) {
    return this.model.findByIdAndDelete(workspaceId).session(session);
  }
}
