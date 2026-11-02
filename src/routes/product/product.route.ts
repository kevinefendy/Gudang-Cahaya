import { Router } from "express";
import ProductController from "../../controllers/product/product.controller";
import { authenticateToken } from "../../middleware/auth.middleware";
import upload from "../../middleware/upload.middleware";

const router = Router();

// Semua route produk wajib memakai token JWT
router.use(authenticateToken);

// Melihat semua produk
router.get("/", ProductController.getAll);

// Melihat detail satu produk
router.get("/:id", ProductController.getById);

// Menambahkan produk
router.post("/", upload.single("image"), ProductController.create);

// Mengubah produk
router.put("/:id", upload.single("image"), ProductController.update);

// Menghapus produk
router.delete("/:id", ProductController.delete);


export default router;
