import { ErrorCodeEnum } from "../enums/error-code.enum";
import { Roles } from "../enums/role.enum";
import { MemberRepository } from "../repositories/member.repository";
import { RoleRepository } from "../repositories/role.repository";
import { WorkspaceRepository } from "../repositories/workspace.repository";
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from "../utils/appError";

// Instantiate repositories
const memberRepo = new MemberRepository();
const workspaceRepo = new WorkspaceRepository();
const roleRepo = new RoleRepository();

export const getMemberRoleInWorkspace = async (
  userId: string,
  workspaceId: string
) => {
  const workspace = await workspaceRepo.findById(workspaceId);
  if (!workspace) {
    throw new NotFoundException("Workspace not found");
  }

  const member = await memberRepo.findMemberWithRole(userId, workspaceId);

  if (!member) {
    throw new UnauthorizedException(
      "You are not a member of this workspace",
      ErrorCodeEnum.ACCESS_UNAUTHORIZED
    );
  }

  const roleName = member.role?.name;

  return { role: roleName };
};

export const joinWorkspaceByInviteService = async (
  userId: string,
  inviteCode: string
) => {
  // Find workspace by invite code
  const workspace = await workspaceRepo.findOne({
    inviteCode,
  });

  if (!workspace) {
    throw new NotFoundException("Invalid invite code or workspace not found");
  }

  const existingMember = await memberRepo.isUserAlreadyMember(
    userId,
    workspace._id
  );

  if (existingMember) {
    throw new BadRequestException("You are already a member of this workspace");
  }

  const role = await roleRepo.findOne({ name: Roles.MEMBER });

  if (!role) {
    throw new NotFoundException("Role not found");
  }

  // Add user to workspace as a member
  await memberRepo.addMemberToWorkspace(userId, workspace._id, role._id);

  return { workspaceId: workspace._id, role: role.name };
};
