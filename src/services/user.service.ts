import { UserRepository } from "../repositories/user.repository";
import { BadRequestException } from "../utils/appError";

// Instantiate repository
const userRepo = new UserRepository();

export const getCurrentUserService = async (userId: string) => {
  const user = await userRepo.findByIdWithWorkspace(userId);

  if (!user) {
    throw new BadRequestException("User not found");
  }

  const result = { user };
  return result;
};
