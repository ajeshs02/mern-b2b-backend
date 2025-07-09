import mongoose from "mongoose";
import { Roles } from "../enums/role.enum";
import { BadRequestException, NotFoundException } from "../utils/appError";
import { TaskStatusEnum } from "../enums/task.enum";
import { WorkspaceRepository } from "../repositories/workspace.repository";
import { MemberRepository } from "../repositories/member.repository";
import { RoleRepository } from "../repositories/role.repository";
import { TaskRepository } from "../repositories/task.repository";
import { ProjectRepository } from "../repositories/project.repository";
import { UserRepository } from "../repositories/user.repository";

// Instantiate repositories
const workspaceRepo = new WorkspaceRepository();
const memberRepo = new MemberRepository();
const roleRepo = new RoleRepository();
const userRepo = new UserRepository();
const taskRepo = new TaskRepository();
const projectRepo = new ProjectRepository();

//********************************
// CREATE NEW WORKSPACE
//**************** **************/
export const createWorkspaceService = async (
  userId: string,
  body: {
    name: string;
    description?: string | undefined;
  }
) => {
  const { name, description } = body;

  const user = await userRepo.findById(userId);

  if (!user) {
    throw new NotFoundException("User not found");
  }

  const ownerRole = await roleRepo.findOne({ name: Roles.OWNER });

  if (!ownerRole) {
    throw new NotFoundException("Owner role not found");
  }

  const workspace = await workspaceRepo.create({
    name,
    description,
    owner: user._id,
  } as any);

  await memberRepo.addMemberToWorkspace(user._id, workspace._id, ownerRole._id);

  user.currentWorkspace = workspace._id as mongoose.Types.ObjectId;
  await user.save();

  return {
    workspace,
  };
};

//********************************
// GET WORKSPACES USER IS A MEMBER
//**************** **************/
export const getAllWorkspacesUserIsMemberService = async (userId: string) => {
  const memberships = await memberRepo.findWorkspacesForUser(userId);

  const workspaces = memberships.map(
    (membership: any) => membership.workspaceId
  );

  return { workspaces };
};

export const getWorkspaceByIdService = async (workspaceId: string) => {
  const workspaceWithMembers = await workspaceRepo.findWorkspaceWithMembers(
    workspaceId
  );

  if (!workspaceWithMembers) {
    throw new NotFoundException("Workspace not found");
  }

  return { workspace: workspaceWithMembers };
};

//********************************
// GET ALL MEMEBERS IN WORKSPACE
//**************** **************/
export const getWorkspaceMembersService = async (workspaceId: string) => {
  const members = await memberRepo.findMembersWithUserAndRole(workspaceId);

  const roles = await roleRepo.findAll({}, { name: 1, _id: 1 });

  return { members, roles };
};

export const getWorkspaceAnalyticsService = async (workspaceId: string) => {
  const currentDate = new Date();

  const totalTasks = await taskRepo.countTasks({
    workspace: workspaceId,
  });

  const overdueTasks = await taskRepo.countTasks({
    workspace: workspaceId,
    dueDate: { $lt: currentDate },
    status: { $ne: TaskStatusEnum.DONE },
  });

  const completedTasks = await taskRepo.countTasks({
    workspace: workspaceId,
    status: TaskStatusEnum.DONE,
  });

  return {
    analytics: {
      totalTasks,
      overdueTasks,
      completedTasks,
    },
  };
};

export const changeMemberRoleService = async (
  workspaceId: string,
  memberId: string,
  roleId: string
) => {
  const workspace = await workspaceRepo.findById(workspaceId);
  if (!workspace) {
    throw new NotFoundException("Workspace not found");
  }

  const role = await roleRepo.findById(roleId);
  if (!role) {
    throw new NotFoundException("Role not found");
  }

  const member = await memberRepo.findOne({
    userId: memberId,
    workspaceId,
  });
  if (!member) {
    throw new NotFoundException("Member not found in the workspace");
  }

  member.role = role._id;
  await member.save();

  return { member };
};

//********************************
// UPDATE WORKSPACE
//**************** **************/
export const updateWorkspaceByIdService = async (
  workspaceId: string,
  name: string,
  description?: string
) => {
  const workspace = await workspaceRepo.findById(workspaceId);
  if (!workspace) {
    throw new NotFoundException("Workspace not found");
  }

  // Update the workspace details
  workspace.name = name || workspace.name;
  workspace.description = description || workspace.description;
  await workspace.save();

  return { workspace };
};

export const deleteWorkspaceService = async (
  workspaceId: string,
  userId: string
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Fetch workspace
    const workspace = await workspaceRepo.findById(workspaceId, session);
    if (!workspace) {
      throw new NotFoundException("Workspace not found");
    }

    // Check ownership
    if (workspace.owner.toString() !== userId) {
      throw new BadRequestException(
        "You are not authorized to delete this workspace"
      );
    }

    // Fetch user
    const user = await userRepo.findById(userId, session);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Delete all related entities
    await projectRepo.deleteProjectsByWorkspace(workspaceId, session);
    await taskRepo.deleteTasksByWorkspace(workspaceId, session);
    await memberRepo.deleteMany({ workspaceId }, session);

    // Update user's currentWorkspace if needed
    if (user.currentWorkspace?.equals(workspaceId)) {
      const fallbackWorkspace = await memberRepo.findOne({ userId }, session);
      user.currentWorkspace = fallbackWorkspace
        ? fallbackWorkspace.workspaceId
        : null;
      await user.save({ session });
    }

    // Delete workspace
    await workspace.deleteOne({ session });

    await session.commitTransaction();
    session.endSession();

    return { currentWorkspace: user.currentWorkspace };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};
