import { BaseRepository } from "./base.repository";
import ProjectModel from "../models/project.model";

export class ProjectRepository extends BaseRepository<typeof ProjectModel> {
  constructor() {
    super(ProjectModel);
  }

  /**
   * Find a project by ID and workspace ID
   */
  async findByIdAndWorkspace(workspaceId: string, projectId: string) {
    return this.model
      .findOne({ _id: projectId, workspace: workspaceId })
      .select("_id emoji name description")
      .exec();
  }

  /**
   * Get all projects in a workspace with pagination and populated creator
   */
  async findProjectsInWorkspace(
    workspaceId: string,
    pageSize: number,
    pageNumber: number
  ) {
    const skip = (pageNumber - 1) * pageSize;

    const totalCount = await this.model
      .countDocuments({ workspace: workspaceId })
      .exec();

    const projects = await this.model
      .find({ workspace: workspaceId })
      .skip(skip)
      .limit(pageSize)
      .populate("createdBy", "_id name profilePicture -password")
      .sort({ createdAt: -1 })
      .exec();

    const totalPages = Math.ceil(totalCount / pageSize);

    return { projects, totalCount, totalPages, skip };
  }

  /**
   * Delete all projects in a workspace (used during workspace deletion)
   */
  async deleteProjectsByWorkspace(workspaceId: string, session: any) {
    return this.model.deleteMany({ workspace: workspaceId }).session(session);
  }
}
