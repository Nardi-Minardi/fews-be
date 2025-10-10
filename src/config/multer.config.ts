import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';

export const multerOptions = {
  storage: diskStorage({
    destination: './uploads/images',
    filename: (req, file, callback) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname);
      const filename = `${uniqueSuffix}${ext}`;
      callback(null, filename);
    },
  }),

  fileFilter: (req, file, callback) => {
    if (!file) {
      return callback(new BadRequestException('File is required'), false);
    }

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return callback(
        new BadRequestException(
          'Only image files are allowed (jpg, jpeg, png)',
        ),
        false,
      );
    }

    callback(null, true);
  },

  //2mb
  // limits: {
  //   fileSize: 2 * 1024 * 1024, // 2MB
  // },

  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
};
