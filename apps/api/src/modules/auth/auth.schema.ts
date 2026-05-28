import { z } from 'zod'

export const RegisterInputSchema = z.object({
  name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Senha deve ter ao menos 8 caracteres'),
  role: z.enum(['TUTOR', 'PROVIDER'], { message: 'Papel inválido' }),
})

export const LoginInputSchema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
})

export const ForgotPasswordInputSchema = z.object({
  email: z.string().email('E-mail inválido'),
})

export const ResetPasswordInputSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
  newPassword: z.string().min(8, 'Senha deve ter ao menos 8 caracteres'),
})

export const GoogleCallbackInputSchema = z.object({
  code: z.string().min(1),
  state: z.string().optional(),
})

export type RegisterInput = z.infer<typeof RegisterInputSchema>
export type LoginInput = z.infer<typeof LoginInputSchema>
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordInputSchema>
export type ResetPasswordInput = z.infer<typeof ResetPasswordInputSchema>
export type GoogleCallbackInput = z.infer<typeof GoogleCallbackInputSchema>
