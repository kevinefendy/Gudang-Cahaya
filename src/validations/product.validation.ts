
import { z } from "zod";

export const createProductSchema = z.object({
    name: z.string().trim().min(1, "Nama produk wajib diisi"),
    category: z.string().trim().min(1, "Kategori wajib diisi"),
    price: z.coerce.number().positive("Harga harus lebih dari 0"),
    stock: z.coerce.number().int().min(0, "Stok tidak boleh negatif"),
    description: z.string().trim().min(1, "Deskripsi wajib diisi"),
});

export const updateProductSchema = createProductSchema.partial();
