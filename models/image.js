var mongoose = require('mongoose');
var imageSchema = new mongoose.Schema({
    name: String,
    desc: String,
    img:
    {
        data: Buffer,
        contentType: String
    }
});
module.exports = mongoose.model('Images', imageSchema); // on ajoute cette Schema dnas la base de donnee