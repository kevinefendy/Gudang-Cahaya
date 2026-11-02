import { Request, Response } from "express";
import { eq, desc, and } from "drizzle-orm";
import { db } from "../../config/db";
import { products } from "../../config/schema";
import { createProductSchema, updateProductSchema, } from "../../validations/product.validation";
import cloudinary from "../../config/cloudinary";
import { uploadToCloudinary } from "../../utils/cloudinary.util";

class ProductController {
    // GET: Melihat semua produk  
    getAll = async (req: Request, res: Response) => {
        try {
            const data = await db
                .select()
                .from(products)
                .where(eq(products.status, "published"))
                .orderBy(desc(products.createdAt));
        
            return res.status(200).json({
                message: "Berhasil mengambil semua produk",
                data,
            });
        } catch (error) {
            console.error("Get products error:", error);
        
            return res.status(500).json({
                message: "Gagal mengambil produk",
            });
        }
    };


    // GET: Melihat satu produk berdasarkan ID
    getById = async (req: Request, res: Response) => {
        try {
            const id = Number(req.params.id);

            if (!Number.isInteger(id) || id <= 0) {
                return res.status(400).json({
                    message: "ID produk tidak valid",
                });
            }

            const product = await db.query.products.findFirst({
                where: and(
                    eq(products.id, id),
                    eq(products.status, "published")
                ),
            });

            if (!product) {
                return res.status(404).json({
                    message: "Produk tidak ditemukan",
                });
            }

            return res.status(200).json({
                message: "Berhasil mengambil detail produk",
                data: product,
            });
        } catch (error) {
            console.error("Get product error:", error);
            return res.status(500).json({
                message: "Gagal mengambil detail produk",
            });
        }
    };

    
create = async (req: Request, res: Response) => {
    let uploadedPublicId: string | undefined;

    try {
        const parsed = createProductSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({
                message: "Validasi produk gagal",
                errors: parsed.error.flatten().fieldErrors,
            });
        }

        if (!req.file) {
            return res.status(400).json({
                message: "Gambar produk wajib diunggah",
            });
        }

        const uploaded = await uploadToCloudinary(req.file.buffer);
        uploadedPublicId = uploaded.public_id;

        const result = await db
            .insert(products)
            .values({
                name: parsed.data.name,
                category: parsed.data.category,
                price: String(parsed.data.price),
                stock: parsed.data.stock,
                description: parsed.data.description,
                imageUrl: uploaded.secure_url,
                imagePublicId: uploaded.public_id,
            })
            .$returningId();

        const id = result[0]?.id;

        if (!id) {
            await cloudinary.uploader.destroy(uploaded.public_id);
            uploadedPublicId = undefined;

            return res.status(500).json({
                message: "Produk gagal ditambahkan",
            });
        }

        const product = await db.query.products.findFirst({
            where: eq(products.id, id),
        });

        if (!product) {
            return res.status(500).json({
                message: "Produk berhasil disimpan tetapi gagal diambil",
            });
        }

        return res.status(201).json({
            message: "Produk berhasil ditambahkan",
            data: product,
        });
    } catch (error) {
        if (uploadedPublicId) {
            try {
                await cloudinary.uploader.destroy(uploadedPublicId);
            } catch (cleanupError) {
                console.error("Gagal membersihkan gambar:", cleanupError);
            }
        }

        console.error("Create product error:", error);

        return res.status(500).json({
            message: "Gagal menambahkan produk",
        });
    }
};


    
update = async (req: Request, res: Response) => {
    let newPublicId: string | undefined;

    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "ID produk tidak valid",
            });
        }

        const parsed = updateProductSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({
                message: "Validasi produk gagal",
                errors: parsed.error.flatten().fieldErrors,
            });
        }

        const existing = await db.query.products.findFirst({
            where: and(
                eq(products.id, id),
                eq(products.status, "published")
            ),
        });

        if (!existing) {
            return res.status(404).json({
                message: "Produk tidak ditemukan",
            });
        }

        const hasData = Object.keys(parsed.data).length > 0;
        const hasImage = Boolean(req.file);

        if (!hasData && !hasImage) {
            return res.status(400).json({
                message: "Kirim data atau gambar yang ingin diubah",
            });
        }

        let imageUrl = existing.imageUrl;
        let imagePublicId = existing.imagePublicId;

        if (req.file) {
            const uploaded = await uploadToCloudinary(req.file.buffer);

            newPublicId = uploaded.public_id;
            imageUrl = uploaded.secure_url;
            imagePublicId = uploaded.public_id;
        }
   
        const updateData = {
            ...(parsed.data.name !== undefined
                ? { name: parsed.data.name }
                : {}),
            ...(parsed.data.category !== undefined
                ? { category: parsed.data.category }
                : {}),
            ...(parsed.data.price !== undefined
                ? { price: String(parsed.data.price) }
                : {}),
            ...(parsed.data.stock !== undefined
                ? { stock: parsed.data.stock }
                : {}),
            ...(parsed.data.description !== undefined
                ? { description: parsed.data.description }
                : {}),
            imageUrl,
            imagePublicId,
            updatedAt: new Date(),
        };

await db
    .update(products)
    .set(updateData)
    .where(eq(products.id, id));


        const updated = await db.query.products.findFirst({
            where: eq(products.id, id),
        });

        // Hapus gambar lama hanya setelah update database berhasil.
        if (req.file && existing.imagePublicId) {
            try {
                await cloudinary.uploader.destroy(existing.imagePublicId);
            } catch (cleanupError) {
                console.error("Gagal menghapus gambar lama:", cleanupError);
            }
        }

        return res.status(200).json({
            message: "Produk berhasil diperbarui",
            data: updated,
        });
    } catch (error) {
        if (newPublicId) {
            try {
                await cloudinary.uploader.destroy(newPublicId);
            } catch (cleanupError) {
                console.error("Gagal membersihkan gambar baru:", cleanupError);
            }
        }

        console.error("Update product error:", error);

        return res.status(500).json({
            message: "Gagal memperbarui produk",
        });
    }
};

    

delete = async (req: Request, res: Response) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({
                message: "ID produk tidak valid",
            });
        }

        const existing = await db.query.products.findFirst({
            where: and(
                eq(products.id, id),
                eq(products.status, "published")
            ),
        });

        if (!existing) {
            return res.status(404).json({
                message: "Produk tidak ditemukan",
            });
        }

        // Ubah status produk menjadi deleted
        await db
            .update(products)
            .set({
                status: "deleted",
                updatedAt: new Date(),
            })
            .where(eq(products.id, id));

        // Hapus gambar dari Cloudinary
        if (existing.imagePublicId) {
            try {
                await cloudinary.uploader.destroy(
                    existing.imagePublicId
                );
            } catch (imageError) {
                console.error(
                    "Gagal menghapus gambar Cloudinary:",
                    imageError
                );
            }
        }

        return res.status(200).json({
            message: "Produk berhasil dihapus",
        });

    } catch (error) {
        console.error("Delete product error:", error);

        return res.status(500).json({
            message: "Gagal menghapus produk",
        });
    }
};

}

export default new ProductController();
