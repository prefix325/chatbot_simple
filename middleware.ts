import NextAuth from 'next-auth';

import { authConfig } from '@/app/(auth)/auth.config';

// Temporarily disabled to debug
// export default NextAuth(authConfig).auth;

export const config = {
  matcher: [],
};
