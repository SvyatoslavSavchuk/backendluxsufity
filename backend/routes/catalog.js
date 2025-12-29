import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import Catalog from '../models/catalog.js';
import fs from 'fs'
import { verifyToken } from '../middleware/auth.js'

const router = express.Router();

// Для корректной работы __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Настройка Multer
const uploadDir = path.join(__dirname, '../public/uploads/catalogs');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const fileName = Date.now() + '-' + file.originalname.replace(/\s+/g, '-');
        cb(null, fileName);
    },
});
const upload = multer({ storage });

// Загрузка + замена по slug
router.post('/upload', upload.single('file'), verifyToken, async (req, res) => {
    try {
        const { title, slug } = req.body;
        const protocol = req.protocol;
        const host = req.get('host'); // например: localhost:3001
        const filePath = `${protocol}://${host}/public/uploads/catalogs/${req.file.filename}`;

        const existing = await Catalog.findOne({ slug });
        if (existing) {
            const oldPath = path.join(__dirname, '../', existing.url);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
            existing.title = title;
            existing.url = filePath;
            await existing.save();
            return res.json({ message: 'Каталог обновлён' });
        }

        const newCatalog = new Catalog({ title, slug, url: filePath });
        await newCatalog.save();
        res.json({ message: 'Каталог добавлен' });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Ошибка при загрузке' });
    }
});

// Получение списка
router.get('/', async (req, res) => {
    try {
        const catalogs = await Catalog.find();
        res.json(catalogs);
    } catch (err) {
        res.status(500).json({ error: 'Ошибка при получении' });
    }
});

// Удаление по ID
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const catalog = await Catalog.findById(req.params.id);
        if (!catalog) return res.status(404).json({ message: 'Каталог не найден' });

        // Очищаем URL от протокола и домена, если случайно записали полный
        let relativePath = catalog.url
        .replace(/^https?:\/\/[^\/]+/, '')  // убираем http://localhost:3001
        .replace(/^\/+/, '');               // убираем ведущий слэш

        const filePath = path.resolve(__dirname, '..', relativePath);
        console.log('Удаляем файл:', filePath);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        console.log('Файл удалён с диска');
        } else {
            console.warn('Файл не найден на диске');
        }

        await Catalog.findByIdAndDelete(req.params.id);
        res.json({ message: 'Каталог удалён' });

    } catch (err) {
        console.error('Ошибка при удалении:', err);
        res.status(500).json({ error: 'Ошибка при удалении' });
    }
});

export default router;