import mongoose from 'mongoose';

const catalogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    slug: {
        type: String,
        required: true,
        unique: true },
    url: {
        type: String,
        required: true,
        trim: true,
    }
});

const Catalog = mongoose.model('Catalog', catalogSchema);

export default Catalog;
