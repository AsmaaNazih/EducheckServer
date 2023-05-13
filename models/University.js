const mongoose= require('mongoose');

const UniversitySchema = mongoose.Schema({
    name: {
        type: String,
        requried: false
    }

});


module.exports = mongoose.model('University', UniversitySchema); // on ajoute cette Schema dnas la base de donnee