import { Request, Response } from "express";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { registerSchema, loginSchema } from "../../validations/auth.validation";
import { db } from "../../config/db";
import { users } from "../../config/schema";

export class AuthController {
    register = async (req: Request, res: Response) => {
        try {
            const parsed = registerSchema.safeParse(req.body);

            if (!parsed.success) {
                return res.status(400).json({
                    success: false,
                    message: "Data register tidak valid",
                    errors: parsed.error.flatten().fieldErrors,
                });
            }

            const { username, email, password } = parsed.data;
            const normalizedEmail = email.toLowerCase();

            const existingUser = await db.query.users.findFirst({
                where: eq(users.email, normalizedEmail),
            });

            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    message: "Email sudah terdaftar",
                });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const [insertedUser] = await db
                .insert(users)
                .values({
                    username,
                    email: normalizedEmail,
                    password: hashedPassword,
                })
                .$returningId();

            const newUser = await db.query.users.findFirst({
                where: eq(users.id, insertedUser.id),
            });

            return res.status(201).json({
                success: true,
                message: "Register berhasil",
                data: {
                    user: {
                        id: newUser?.id,
                        username: newUser?.username,
                        email: newUser?.email,
                    },
                },
            });
        } catch (error) {
            if (error instanceof Error && error.name === "ZodError") {
                return res.status(400).json({
                    success: false,
                    message: "Data register tidak valid",
                });
            }

            console.error(error);
            return res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    };

    login = async (req: Request, res: Response) => {
        try {
            const parsed = loginSchema.safeParse(req.body);

            if (!parsed.success) {
                return res.status(400).json({
                    success: false,
                    message: "Data login tidak valid",
                    errors: parsed.error.flatten().fieldErrors,
                });
            }

            const { email, password } = parsed.data;
            const normalizedEmail = email.toLowerCase();

            const user = await db.query.users.findFirst({
                where: eq(users.email, normalizedEmail),
            });

            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: "Email atau password salah",
                });
            }

            const isPasswordValid = await bcrypt.compare(
                password,
                user.password
            );

            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: "Email atau password salah",
                });
            }

            const secret = process.env.JWT_SECRET;

            if (!secret) {
                console.error("JWT_SECRET belum dikonfigurasi");
                return res.status(500).json({
                    success: false,
                    message: "Konfigurasi server belum lengkap",
                });
            }

            const token = jwt.sign(
                {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                },
                secret,
                { expiresIn: "7d" }
            );

            return res.status(200).json({
                success: true,
                message: "Login berhasil",
                data: {
                    token,
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                    },
                },
            });
        } catch (error) {
            if (error instanceof Error && error.name === "ZodError") {
                return res.status(400).json({
                    success: false,
                    message: "Data login tidak valid",
                });
            }

            console.error(error);
            return res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
    };
}

export default new AuthController();
