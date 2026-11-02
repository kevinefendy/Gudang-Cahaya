import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
    id: number;
    username: string;
    email: string;
}

declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

export const authenticateToken = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : undefined;

    if (!token) {
        return res.status(401).json({
            message: "Token autentikasi tidak ditemukan",
        });
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
        return res.status(500).json({
            message: "Konfigurasi JWT belum tersedia",
        });
    }

    try {
        const decoded = jwt.verify(token, secret);

        if (typeof decoded === "string") {
            return res.status(401).json({
                message: "Token tidak valid",
            });
        }

        if (
            typeof decoded.id !== "number" ||
            typeof decoded.username !== "string" ||
            typeof decoded.email !== "string"
        ) {
            return res.status(401).json({
                message: "Payload token tidak valid",
            });
        }
        
        req.user = {
            id: decoded.id,
            username: decoded.username,
            email: decoded.email,
        };
        
        next();
    } catch {
        return res.status(401).json({
            message: "Token tidak valid atau sudah kedaluwarsa",
        });
    }
};
