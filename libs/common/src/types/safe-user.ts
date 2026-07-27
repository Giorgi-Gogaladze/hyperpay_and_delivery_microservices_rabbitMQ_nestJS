import { User } from "../../../../apps/identity-service/src/generated/prisma/client";

export type safeUser = Omit<User, 'password' | 'refreshToken' | 'resetToken' | 'resetTokenExpiry'>;

export type safeUserAuth = Omit<User, 'password' | 'refreshToken'>; 