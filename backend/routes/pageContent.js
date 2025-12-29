import express from 'express';
import PageContent from '../models/pageContent.js';
import {verifyToken} from '../middleware/auth.js'; // если хочешь ограничить доступ

const router = express.Router();

// Получить контент по странице
router.get('/:page', async (req, res) => {
  try {
    const page = req.params.page;
    const content = await PageContent.findOne({ page });

    if (!content) {
      return res.status(404).json({ message: 'Контент не найден' });
    }

    res.json(content.content);
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Обновить контент по странице
router.post('/:page', verifyToken, async (req, res) => {
  try {
    const page = req.params.page;
    const updatedContent = req.body;

    const existing = await PageContent.findOne({ page });

    const newContent = {
      ...(existing?.content || {}),
      ...updatedContent
    };

    const result = await PageContent.findOneAndUpdate(
      { page },
      { content: newContent },
      { upsert: true, new: true }
    );


    res.json({ message: 'Контент обновлён', content: result.content });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка при обновлении' });
  }
});

// 🗑 Удалить картинку из категории
router.post('/delete', verifyToken, async (req, res) => {
  try {
    const { category, path: imagePath } = req.body;

    if (!category || !imagePath) {
      return res.status(400).json({ message: 'Категория или путь к изображению не указаны' });
    }

    // Удаление файла с диска
    const fullPath = path.resolve(`.${imagePath}`); // например: ./uploads/Matte/123.jpg
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath); // Удаление файла
    } else {
      console.warn('Файл не найден на диске:', fullPath);
    }

    // Удаление пути из базы данных
    const result = await PictureCategory.findOneAndUpdate(
      { category },
      { $pull: { pictures: imagePath } }, // удаляет строку из массива
      { new: true }
    );

    res.json({
      message: 'Картинка удалена',
      pictures: result?.pictures || []
    });

  } catch (err) {
    console.error('Ошибка при удалении:', err);
    res.status(500).json({ message: 'Ошибка при удалении картинки' });
  }
});


export default router;
