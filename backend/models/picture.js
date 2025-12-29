import mongoose from 'mongoose';

const PictureCategorySchema = new mongoose.Schema({
  category: { type: String, required: true, unique: true },
  pictures: [{ type: String }] // просто массив строк (путей к файлам)
});

export default mongoose.model('PictureCategory', PictureCategorySchema);
