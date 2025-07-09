import { BaseRepository } from "./base.repository";
import RoleModel from "../models/roles-permission.model";

export class RoleRepository extends BaseRepository<typeof RoleModel> {
  constructor() {
    super(RoleModel);
  }
}
