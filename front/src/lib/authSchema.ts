import { z } from 'zod';

/**
 * Standard password validation for all auth forms (LoginPage, RegisterPage,
 * ResetPasswordPage). Matches the backend password policy enforced by the
 * auth service:
 * - minimum 8 characters
 * - at least one uppercase letter [A-Z]
 * - at least one lowercase letter [a-z]
 * - at least one number [0-9]
 * - at least one special character [@$!%*?&]
 *
 * Each rule emits a distinct i18n key so the UI can show a precise,
 * localized hint for the exact constraint that is missing.
 */
export const passwordSchema = z
  .string()
  .min(8, 'auth.passwordMinLength')
  .regex(/[A-Z]/, 'auth.passwordNeedsUppercase')
  .regex(/[a-z]/, 'auth.passwordNeedsLowercase')
  .regex(/[0-9]/, 'auth.passwordNeedsNumber')
  .regex(/[@$!%*?&]/, 'auth.passwordNeedsSpecialChar');

export const emailSchema = z.string().email('auth.emailInvalid');

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerSchema = z
  .object({
    first_name: z.string().min(1, 'auth.required'),
    last_name: z.string().min(1, 'auth.required'),
    email: emailSchema,
    phone: z.string().optional(),
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'auth.required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'auth.passwordMismatch',
    path: ['confirmPassword'],
  });

export const resetPasswordSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'auth.required'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'auth.passwordMismatch',
    path: ['confirmPassword'],
  });

export const resetRequestSchema = z.object({
  email: emailSchema,
});

export type LoginForm = z.infer<typeof loginSchema>;
export type RegisterForm = z.infer<typeof registerSchema>;
export type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;
export type ResetRequestForm = z.infer<typeof resetRequestSchema>;
