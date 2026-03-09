import { createSelector } from '@reduxjs/toolkit';
import { userApi } from './user.api';

export const getUserEmail = createSelector(
  userApi.endpoints.getUser.select(),
  (res): string => {
    if (!res.data) return '';
    return res.data.email;
  },
);
