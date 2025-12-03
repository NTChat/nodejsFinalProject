// models/Post.js
const mongoose = require('mongoose'); 
const postSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    poster:{ type: String, required: true },
    creatAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Post', postSchema);

