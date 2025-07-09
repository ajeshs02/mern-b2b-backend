import mongoose from "mongoose";
import { TaskPriorityEnumType, TaskStatusEnumType } from "../enums/task.enum";
import { MemberRepository } from "../repositories/member.repository";
import { ProjectRepository } from "../repositories/project.repository";
import { TaskRepository } from "../repositories/task.repository";
import { BadRequestException, NotFoundException } from "../utils/appError";

// Instantiate repositories
const taskRepo = new TaskRepository();
const projectRepo = new ProjectRepository();
const memberRepo = new MemberRepository();

export const createTaskService = async (
  workspaceId: string,
  projectId: string,
  userId: string,
  body: {
    title: string;
    description?: string;
    priority: string;
    status: string;
    assignedTo?: string | null;
    dueDate?: string;
  }
) => {
  const { title, description, priority, status, assignedTo, dueDate } = body;

  const project = await projectRepo.findById(projectId);

  if (!project || project.workspace.toString() !== workspaceId.toString()) {
    throw new NotFoundException(
      "Project not found or does not belong to this workspace"
    );
  }
  if (assignedTo) {
    const isAssignedUserMember = await memberRepo.findOne({
      userId: assignedTo,
      workspaceId,
    });

    if (!isAssignedUserMember) {
      throw new Error("Assigned user is not a member of this workspace.");
    }
  }
  const task = await taskRepo.create({
    title,
    description,
    priority: priority as TaskPriorityEnumType,
    status: status as TaskStatusEnumType,
    assignedTo: assignedTo
      ? new mongoose.Types.ObjectId(assignedTo)
      : undefined,
    createdBy: new mongoose.Types.ObjectId(userId),
    workspace: new mongoose.Types.ObjectId(workspaceId),
    project: new mongoose.Types.ObjectId(projectId),
    dueDate: dueDate ? new Date(dueDate) : null,
  } as any);

  return { task };
};

export const updateTaskService = async (
  workspaceId: string,
  projectId: string,
  taskId: string,
  body: {
    title: string;
    description?: string;
    priority: string;
    status: string;
    assignedTo?: string | null;
    dueDate?: string;
  }
) => {
  const project = await projectRepo.findById(projectId);

  if (!project || project.workspace.toString() !== workspaceId.toString()) {
    throw new NotFoundException(
      "Project not found or does not belong to this workspace"
    );
  }

  const task = await taskRepo.findById(taskId);

  if (!task || task.project.toString() !== projectId.toString()) {
    throw new NotFoundException(
      "Task not found or does not belong to this project"
    );
  }

  const updatedTask = await taskRepo.update(taskId, {
    ...body,
    priority: body.priority as TaskPriorityEnumType,
    status: body.status as TaskStatusEnumType,
    assignedTo: body.assignedTo
      ? new mongoose.Types.ObjectId(body.assignedTo)
      : undefined,
    dueDate: body.dueDate ? new Date(body.dueDate) : null,
  } as any);

  if (!updatedTask) {
    throw new BadRequestException("Failed to update task");
  }

  return { updatedTask };
};

export const getAllTasksService = async (
  workspaceId: string,
  filters: {
    projectId?: string;
    status?: string[];
    priority?: string[];
    assignedTo?: string[];
    keyword?: string;
    dueDate?: string;
  },
  pagination: {
    pageSize: number;
    pageNumber: number;
  }
) => {
  const query: Record<string, any> = { workspace: workspaceId };

  if (filters.projectId) query.project = filters.projectId;
  if (filters.status?.length) query.status = { $in: filters.status };
  if (filters.priority?.length) query.priority = { $in: filters.priority };
  if (filters.assignedTo?.length)
    query.assignedTo = { $in: filters.assignedTo };
  if (filters.keyword) query.title = { $regex: filters.keyword, $options: "i" };
  if (filters.dueDate) query.dueDate = { $eq: new Date(filters.dueDate) };

  return await taskRepo.findTasksWithFilters(
    query,
    pagination.pageSize,
    pagination.pageNumber
  );
};

export const getTaskByIdService = async (
  workspaceId: string,
  projectId: string,
  taskId: string
) => {
  const project = await projectRepo.findById(projectId);

  if (!project || project.workspace.toString() !== workspaceId.toString()) {
    throw new NotFoundException(
      "Project not found or does not belong to this workspace"
    );
  }

  const task = await taskRepo.findTaskByWorkspaceProject(
    workspaceId,
    projectId,
    taskId
  );

  if (!task) {
    throw new NotFoundException("Task not found.");
  }

  return task;
};

export const deleteTaskService = async (
  workspaceId: string,
  taskId: string
) => {
  const task = await taskRepo.deleteTaskByWorkspace(workspaceId, taskId);

  if (!task) {
    throw new NotFoundException(
      "Task not found or does not belong to the specified workspace"
    );
  }

  return;
};
