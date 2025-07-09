import { BaseRepository } from "./base.repository";
import TaskModel from "../models/task.model";

export class TaskRepository extends BaseRepository<typeof TaskModel> {
  constructor() {
    super(TaskModel);
  }

  /**
   * Find tasks with filters, pagination, and populated fields
   */
  async findTasksWithFilters(
    query: Record<string, any>,
    pageSize: number,
    pageNumber: number
  ) {
    const skip = (pageNumber - 1) * pageSize;

    const [tasks, totalCount] = await Promise.all([
      this.model
        .find(query)
        .skip(skip)
        .limit(pageSize)
        .sort({ createdAt: -1 })
        .populate("assignedTo", "_id name profilePicture -password")
        .populate("project", "_id emoji name")
        .exec(),
      this.model.countDocuments(query).exec(),
    ]);

    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      tasks,
      pagination: {
        pageSize,
        pageNumber,
        totalCount,
        totalPages,
        skip,
      },
    };
  }

  /**
   * Find a task by workspace, project, and taskId with populated assignedTo
   */
  async findTaskByWorkspaceProject(
    workspaceId: string,
    projectId: string,
    taskId: string
  ) {
    return this.model
      .findOne({
        _id: taskId,
        workspace: workspaceId,
        project: projectId,
      })
      .populate("assignedTo", "_id name profilePicture -password")
      .exec();
  }

  /**
   * Delete task by workspace and taskId
   */
  async deleteTaskByWorkspace(workspaceId: string, taskId: string) {
    return this.model
      .findOneAndDelete({
        _id: taskId,
        workspace: workspaceId,
      })
      .exec();
  }

  /**
   * Count tasks for analytics (used in workspace analytics)
   */
  async countTasks(query: Record<string, any>) {
    return this.model.countDocuments(query).exec();
  }

  /**
   * Delete all tasks in a workspace (used in workspace deletion)
   */
  async deleteTasksByWorkspace(workspaceId: string, session: any) {
    return this.model.deleteMany({ workspace: workspaceId }).session(session);
  }

  /**
   * Perform an aggregation pipeline
   */
  async aggregate(pipeline: any[]) {
    return this.model.aggregate(pipeline);
  }
}
