import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * 角色限制装饰器，与 RolesGuard 配合使用
 * @example @Roles('admin')
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
