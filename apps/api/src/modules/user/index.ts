import type { UserResponseDto } from '@todo-app/shared/user/schema';
import type { UserRepository } from '#src/modules/user/database/user.repository.port.ts';
import type { UserModel } from '#src/modules/user/database/user.repository.ts';
import type userDomain from '#src/modules/user/domain/user.domain.ts';
import type { UserEntity } from '#src/modules/user/domain/user.types.ts';
import { actionCreatorFactory } from '#src/shared/cqrs/action-creator.ts';
import type { Mapper } from '#src/shared/ddd/mapper.interface.ts';

declare global {
  export interface Dependencies {
    userMapper: Mapper<UserEntity, UserModel, UserResponseDto>;
    userRepository: UserRepository;
    userDomain: ReturnType<typeof userDomain>;
  }
}

export const userActionCreator = actionCreatorFactory('user');
