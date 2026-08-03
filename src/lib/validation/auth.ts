import { z } from "zod";

export const registerSchema = z.object({
  nombreUsuario: z.string().min(2, "Nombre muy corto"),
  email: z.email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  nombreRestaurante: z.string().min(2, "Nombre de restaurante muy corto"),
  ciudad: z.string().min(2).optional(),
});

export const loginSchema = z.object({
  email: z.email("Email inválido"),
  password: z.string().min(1, "Contraseña requerida"),
});

export const forgotPasswordSchema = z.object({
  email: z.email("Email inválido"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token requerido"),
  newPassword: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});
