import { cloudinary } from '../lib/cloudinary.js';
import fs from 'fs';
import type { MultipartFile } from '@fastify/multipart';

export type ImageFolder = 'avatars' | 'covers';

export interface UploadedImage {
	url: string;
	publicId: string;
}

/**
 * Upload image to Cloudinary with automatic optimization
 * @param file - Uploaded file from Fastify multipart
 * @param folder - Folder in Cloudinary (avatars or covers)
 * @returns Object with URL and public ID
 */
export async function uploadImageToCloudinary(
	file: MultipartFile,
	folder: ImageFolder
): Promise<UploadedImage> {
	// Save file temporarily
	const buffer = await file.toBuffer();
	const tempPath = `/tmp/upload-${Date.now()}-${file.filename}`;
	fs.writeFileSync(tempPath, buffer);

	try {
		// Define transformations based on folder
		const transformation = folder === 'avatars'
			? [
					{
						width: 400,
						height: 400,
						crop: 'fill',
						gravity: 'face', // Auto-detect face for better cropping
					},
			  ]
			: [
					{
						width: 1500,
						height: 500,
						crop: 'fill',
					},
			  ];

		// Upload to Cloudinary
		const result = await cloudinary.uploader.upload(tempPath, {
			folder: `social-app/${folder}`,
			transformation,
			quality: 'auto', // Automatic quality optimization
			fetch_format: 'auto', // Automatic format (WebP for supported browsers)
		});

		// Delete temporary file
		fs.unlinkSync(tempPath);

		return {
			url: result.secure_url,
			publicId: result.public_id,
		};
	} catch (error) {
		// Clean up temp file on error
		if (fs.existsSync(tempPath)) {
			fs.unlinkSync(tempPath);
		}
		throw error;
	}
}

/**
 * Delete image from Cloudinary
 * @param publicId - Public ID of the image to delete
 */
export async function deleteImageFromCloudinary(publicId: string): Promise<void> {
	try {
		await cloudinary.uploader.destroy(publicId);
	} catch (error) {
		console.error('Failed to delete image from Cloudinary:', error);
		// Don't throw - deletion failure shouldn't block user actions
	}
}
