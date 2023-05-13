const mongoose= require('mongoose');

const UniversitySchema = mongoose.Schema({
    name: {
        type: String,
        requried: false
    },

    suffixe: {
        type: String,
        required: true
    },

    paths: [{
        id:false,
        name: {
            type: String,
            required: false
        }}
        ]

});


module.exports = mongoose.model('University', UniversitySchema); // on ajoute cette Schema dnas la base de donnee