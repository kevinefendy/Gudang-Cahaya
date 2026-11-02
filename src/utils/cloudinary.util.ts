import { UploadApiResponse } from "cloudinary";
import cloudinary from "../config/cloudinary";

export const uploadToCloudinary = (
    buffer: Buffer
): Promise<UploadApiResponse> => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                folder: "manajemen_produk",
                resource_type: "image",
            },
            (error, result) => {
                if (error) {
                    reject(error);
                    return;
                }

                if (!result) {
                    reject(new Error("Upload Cloudinary gagal"));
                    return;
                }

                resolve(result);
            }
        );

        stream.end(buffer);
    });
};
