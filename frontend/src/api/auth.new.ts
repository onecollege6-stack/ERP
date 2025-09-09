import { LoginPayload, AuthUser } from '../auth/types';
import api from './axios';

type LoginResponse = { token: string; user: AuthUser };

export async function loginApi(payload: LoginPayload): Promise<LoginResponse> {
  const res = await api.post('/auth/login', payload);
  const { token, user } = res.data;
  // Only allow SUPER_ADMIN, ADMIN, TEACHER roles
  if (!['SUPER_ADMIN', 'ADMIN', 'TEACHER'].includes(user.role)) {
    throw new Error('Role not allowed');
  }
  return { token, user };
}
