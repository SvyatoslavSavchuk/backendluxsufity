import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import PictureCategory from '../models/picture.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

/* ===============================
   TEMP UPLOAD DIR
================================ */
const uploadTempPath = path.resolve('uploads/_temp');
if (!fs.existsSync(uploadTempPath)) {
  fs.mkdirSync(uploadTempPath, { recursive: true });
}

/* ===============================
   MULTER CONFIG
================================ */
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadTempPath);
  },
  filename(req, file, cb) {
    const safeName = file.originalname.replace(/\s+/g, '_');
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

/* ===============================
   MULTI UPLOAD (WebP + JPG)
   WINDOWS SAFE
================================ */
router.post(
  '/upload',
  verifyToken,
  upload.array('images', 20),
  async (req, res) => {
    try {
      const { category } = req.body;

      if (!category || !req.files?.length) {
        return res.status(400).json({
          message: 'Файлы или категория не указаны',
        });
      }

      const categoryDir = path.resolve('uploads', category);
      if (!fs.existsSync(categoryDir)) {
        fs.mkdirSync(categoryDir, { recursive: true });
      }

      const savedPaths = [];

      for (const file of req.files) {
        const baseName = path.parse(file.filename).name;
        const basePath = path.join(categoryDir, baseName);

        // ⚠️ читаем файл в buffer (Windows fix)
        const buffer = await fs.promises.readFile(file.path);

        // WebP
        await sharp(buffer)
          .webp({ quality: 80 })
          .toFile(`${basePath}.webp`);

        // JPG fallback
        await sharp(buffer)
          .jpeg({ quality: 85 })
          .toFile(`${basePath}.jpg`);

        // безопасное удаление temp-файла
        fs.promises.unlink(file.path).catch(() => {});

        savedPaths.push(`/uploads/${category}/${baseName}`);
      }

      const result = await PictureCategory.findOneAndUpdate(
        { category },
        { $push: { pictures: { $each: savedPaths } } },
        { upsert: true, new: true }
      );

      res.status(201).json({
        message: 'Файлы успешно загружены',
        paths: savedPaths,
        pictures: result.pictures,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({
        message: 'Ошибка при загрузке изображений',
      });
    }
  }
);

/* ===============================
   CATEGORY LABELS
================================ */
function getLabel(key) {
  const map = {
    Matte: 'Matowe sufity napinane',
    StarrySky: 'Gwiaździste niebo',
    Print: 'Sufity napinane z nadrukiem',
    lustrzaneSufit: 'Błyszczące (lustrzane) sufity napinane',
    satynowe: 'Sufity napinane satynowe',
    oswietleniem: 'Oświetlenie LED na sufitach napinanych',
  };
  return map[key] || key;
}

/* ===============================
   GET CATEGORIES
================================ */
router.get('/categories', async (req, res) => {
  try {
    const categories = await PictureCategory.find({}, 'category');
    res.json(
      categories.map((cat) => ({
        category: cat.category,
        label: getLabel(cat.category),
      }))
    );
  } catch {
    res.status(500).json({
      message: 'Ошибка при получении категорий',
    });
  }
});

/* ===============================
   GET PICTURES BY CATEGORY
================================ */
router.get('/:category', async (req, res) => {
  try {
    const found = await PictureCategory.findOne({
      category: req.params.category,
    });

    if (!found) {
      return res.status(404).json({
        message: 'Категория не найдена',
      });
    }

    res.json({ pictures: found.pictures });
  } catch {
    res.status(500).json({
      message: 'Ошибка при получении изображений',
    });
  }
});

/* ===============================
   DELETE IMAGE (WebP + JPG)
================================ */
router.post('/delete', verifyToken, async (req, res) => {
  try {
    const { category, path: imagePath } = req.body;

    if (!imagePath || !category) {
      return res.status(400).json({
        message: 'Путь или категория не указаны',
      });
    }

    const webpPath = path.resolve(`.${imagePath}.webp`);
    const jpgPath = path.resolve(`.${imagePath}.jpg`);

    if (fs.existsSync(webpPath)) fs.unlinkSync(webpPath);
    if (fs.existsSync(jpgPath)) fs.unlinkSync(jpgPath);

    const result = await PictureCategory.findOneAndUpdate(
      { category },
      { $pull: { pictures: imagePath } },
      { new: true }
    );

    res.json({
      message: 'Файл успешно удален',
      pictures: result?.pictures || [],
    });
  } catch {
    res.status(500).json({
      message: 'Ошибка при удалении файла',
    });
  }
});

export default router;
