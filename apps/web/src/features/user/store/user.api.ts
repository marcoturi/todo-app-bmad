import type { UserResponseDto } from '@todo-app/shared/user/types';
import baseApi from '@/shared/store/api';

export const userApi = baseApi
  .enhanceEndpoints({ addTagTypes: ['User'] })
  .injectEndpoints({
    endpoints: (build) => ({
      getUser: build.query<UserResponseDto, void>({
        query: () => 'api/v1/users',
      }),
    }),
    overrideExisting: false,
  });

export const { useGetUserQuery } = userApi;
