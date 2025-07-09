import mongoose from "mongoose";
import { NotFoundException } from "../utils/appError";
import { TaskStatusEnum } from "../enums/task.enum";
import { TaskRepository } from "../repositories/task.repository";
import { ProjectRepository } from "../repositories/project.repository";

// Instantiate repositories
const projectRepo = new ProjectRepository();
const taskRepo = new TaskRepository();

export const createProjectService = async (
  userId: string,
  workspaceId: string,
  body: {
    emoji?: string;
    name: string;
    description?: string;
  }
) => {
  const project = await projectRepo.create({
    ...(body.emoji && { emoji: body.emoji }),
    name: body.name,
    description: body.description,
    workspace: new mongoose.Types.ObjectId(workspaceId),
    createdBy: new mongoose.Types.ObjectId(userId),
  } as any);

  return { project };
};

export const getProjectsInWorkspaceService = async (
  workspaceId: string,
  pageSize: number,
  pageNumber: number
) => {
  return await projectRepo.findProjectsInWorkspace(
    workspaceId,
    pageSize,
    pageNumber
  );
};

export const getProjectByIdAndWorkspaceIdService = async (
  workspaceId: string,
  projectId: string
) => {
  const project = await projectRepo.findByIdAndWorkspace(
    workspaceId,
    projectId
  );

  if (!project) {
    throw new NotFoundException(
      "Project not found or does not belong to the specified workspace"
    );
  }

  return { project };
};

export const getProjectAnalyticsService = async (
  workspaceId: string,
  projectId: string
) => {
  const project = await projectRepo.findById(projectId);

  if (!project || project.workspace.toString() !== workspaceId.toString()) {
    throw new NotFoundException(
      "Project not found or does not belong to this workspace"
    );
  }

  const currentDate = new Date();

  //USING Mongoose aggregate
  const taskAnalytics = await taskRepo.aggregate([
    {
      $match: {
        project: new mongoose.Types.ObjectId(projectId),
      },
    },
    {
      $facet: {
        totalTasks: [{ $count: "count" }],
        overdueTasks: [
          {
            $match: {
              dueDate: { $lt: currentDate },
              status: { $ne: TaskStatusEnum.DONE },
            },
          },
          { $count: "count" },
        ],
        completedTasks: [
          { $match: { status: TaskStatusEnum.DONE } },
          { $count: "count" },
        ],
      },
    },
  ]);

  const _analytics = taskAnalytics[0];

  const analytics = {
    totalTasks: _analytics.totalTasks[0]?.count || 0,
    overdueTasks: _analytics.overdueTasks[0]?.count || 0,
    completedTasks: _analytics.completedTasks[0]?.count || 0,
  };

  return {
    analytics,
  };
};

export const updateProjectService = async (
  workspaceId: string,
  projectId: string,
  body: {
    emoji?: string;
    name: string;
    description?: string;
  }
) => {
  const { name, emoji, description } = body;

  const project = await projectRepo.findByIdAndWorkspace(
    workspaceId,
    projectId
  );

  if (!project) {
    throw new NotFoundException(
      "Project not found or does not belong to the specified workspace"
    );
  }

  if (emoji) project.emoji = emoji;
  if (name) project.name = name;
  if (description) project.description = description;

  await project.save();

  return { project };
};

export const deleteProjectService = async (
  workspaceId: string,
  projectId: string
) => {
  const project = await projectRepo.findByIdAndWorkspace(
    workspaceId,
    projectId
  );

  if (!project) {
    throw new NotFoundException(
      "Project not found or does not belong to the specified workspace"
    );
  }

  await project.deleteOne();
  await taskRepo.deleteTasksByWorkspace(workspaceId, null);

  return project;
};
