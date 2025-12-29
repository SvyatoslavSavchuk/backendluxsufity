import mongoose from 'mongoose';

const PageContentSchema = new mongoose.Schema({
    page: { type: String, required: true, unique: true },
    content: { type: Object, default: {} },
});

export default mongoose.model('PageContent', PageContentSchema);
