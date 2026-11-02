import { z } from "zod";

export const registerSchema = z.object({
    username: z.string().trim().min(1, "Username wajib diisi"),
    email: z.string().trim().email("Format email tidak valid"),
    password: z.string().min(8, "Password minimal 8 karakter"),
});

export const loginSchema = z.object({
    email: z.string().trim().email("Format email tidak valid"),
    password: z.string().min(1, "Password wajib diisi"),
});
