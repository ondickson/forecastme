import { z } from 'zod';

const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required.')
  .email('Enter a valid email address.')
  .max(254, 'Email must be 254 characters or fewer.');

const loginPasswordSchema = z
  .string()
  .min(1, 'Password is required.')
  .max(128, 'Password must be 128 characters or fewer.');

const registrationPasswordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters.')
  .max(128, 'Password must be 128 characters or fewer.');

const displayNameSchema = z
  .string()
  .trim()
  .min(2, 'Display name must be at least 2 characters.')
  .max(100, 'Display name must be 100 characters or fewer.');

export const loginSchema = z.object({
  email: emailSchema,
  password: loginPasswordSchema,
});

export const registrationSchema = z
  .object({
    displayName: displayNameSchema,
    email: emailSchema,
    password: registrationPasswordSchema,
    confirmPassword: z.string().min(1, 'Confirm your password.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegistrationFormValues = z.infer<typeof registrationSchema>;
