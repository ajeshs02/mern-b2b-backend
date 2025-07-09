import mongoose from "mongoose";
import UserModel from "../models/user.model";
import AccountModel from "../models/account.model";
import WorkspaceModel from "../models/workspace.model";
import RoleModel from "../models/roles-permission.model";
import { Roles } from "../enums/role.enum";
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from "../utils/appError";
import MemberModel from "../models/member.model";
import { ProviderEnum } from "../enums/account-provider.enum";
import { UserRepository } from "../repositories/user.repository";
import { WorkspaceRepository } from "../repositories/workspace.repository";
import { RoleRepository } from "../repositories/role.repository";
import { MemberRepository } from "../repositories/member.repository";
import { AccountRepository } from "../repositories/account.repository";

// Instantiate repositories
const userRepo = new UserRepository();
const accountRepo = new AccountRepository();
const workspaceRepo = new WorkspaceRepository();
const roleRepo = new RoleRepository();
const memberRepo = new MemberRepository();

export const loginOrCreateAccountService = async (data: {
  provider: string;
  displayName: string;
  providerId: string;
  picture?: string;
  email?: string;
}) => {
  const { providerId, provider, displayName, email, picture } = data;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    console.log("Started Session...");

    let user = await userRepo.findOne({ email }, session);

    if (!user) {
      // Create new user
      user = await userRepo.create(
        {
          email,
          name: displayName,
          profilePicture: picture || null,
        } as any,
        session
      );

      // Create account
      await accountRepo.create(
        {
          userId: user._id,
          provider,
          providerId,
        } as any,
        session
      );

      // Create a new workspace
      const workspace = await workspaceRepo.create(
        {
          name: `My Workspace`,
          description: `Workspace created for ${user.name}`,
          owner: user._id,
        } as any,
        session
      );

      // Fetch OWNER role
      const ownerRole = await roleRepo.findOne({ name: Roles.OWNER }, session);
      if (!ownerRole) {
        throw new NotFoundException("Owner role not found");
      }

      // Add user as a member
      await memberRepo.addMemberToWorkspace(
        user._id,
        workspace._id,
        ownerRole._id,
        session
      );

      // Set current workspace and save user
      user.currentWorkspace = workspace._id as mongoose.Types.ObjectId;
      await userRepo.save(user, session);

      console.log("user created : ", user);
    }

    await session.commitTransaction();
    console.log("End Session...");
    return { user };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const registerUserService = async (body: {
  email: string;
  name: string;
  password: string;
}) => {
  const { email, name, password } = body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check if user already exists
    const existingUser = await userRepo.findOne({ email }, session);
    if (existingUser) {
      throw new BadRequestException("Email already exists");
    }

    // Create user
    const user = await userRepo.create(
      { email, name, password } as any,
      session
    );

    // Create account
    await accountRepo.create(
      {
        userId: user._id,
        provider: ProviderEnum.EMAIL,
        providerId: email,
      } as any,
      session
    );

    // Create workspace
    const workspace = await workspaceRepo.create(
      {
        name: `My Workspace`,
        description: `Workspace created for ${user.name}`,
        owner: user._id,
      } as any,
      session
    );

    // Fetch OWNER role
    const ownerRole = await roleRepo.findOne({ name: Roles.OWNER }, session);
    if (!ownerRole) {
      throw new NotFoundException("Owner role not found");
    }

    // Add user to workspace as member
    await memberRepo.addMemberToWorkspace(
      user._id,
      workspace._id,
      ownerRole._id,
      session
    );

    // Set currentWorkspace and save user
    user.currentWorkspace = workspace._id as mongoose.Types.ObjectId;
    await userRepo.save(user, session);

    await session.commitTransaction();
    session.endSession();
    console.log("End Session...");

    return {
      userId: user._id,
      workspaceId: workspace._id,
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const verifyUserService = async ({
  email,
  password,
  provider = ProviderEnum.EMAIL,
}: {
  email: string;
  password: string;
  provider?: string;
}) => {
  // Find account
  const account = await accountRepo.findOne({
    provider,
    providerId: email,
  });

  if (!account) {
    throw new NotFoundException("Invalid email or password");
  }

  // Find user
  const user = await userRepo.findById(account.userId);
  if (!user) {
    throw new NotFoundException("User not found for the given account");
  }

  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new UnauthorizedException("Invalid email or password");
  }

  return user.omitPassword();
};
