import type { UserBase } from '../../../../types/common';

// This would be replaced with actual database models (Mongoose/TypeORM)
export interface IUserModel extends UserBase {
  passwordHash?: string;
}

export class UserModel {
  // In production, this would be actual Mongoose schema or TypeORM entity
  static readonly schema = {
    id: 'string',
    email: 'string',
    firstName: 'string',
    lastName: 'string',
    passwordHash: 'string',
    roles: 'string[]',
    isActive: 'boolean',
    createdAt: 'Date',
    updatedAt: 'Date',
  };
}
