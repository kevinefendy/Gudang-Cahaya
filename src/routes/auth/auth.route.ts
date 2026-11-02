import { Router } from "express";
import AuthController from "../../controllers/auth/auth.controller";
import { authenticateToken } from "../../middleware/auth.middleware";

const router = Router();

router.post("/register", AuthController.register);
router.post("/login", AuthController.login);

router.get("/me", authenticateToken, (req, res) => {
    res.json({
        message: "Token valid",
        user: req.user,
    });
});

export default router;
