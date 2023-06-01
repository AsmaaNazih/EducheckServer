const mongoose= require('mongoose');
const {Binary} = require("mongodb");

const UniversitySchema = mongoose.Schema({
    name: {
        type: String,
        required: false
    },

    suffixe_student: {
        type: String,
        required: true
    },
    suffixe_teacher: {
        type: String,
        required: true
    },

    paths: [{

        type: {
            type: String,
            required: false
        },

        name: {
            type: String,
            required: false
        },
        referant: {
            type: String ,
            required: false
        }

    
    }
        ],

    image: {
        type: String ,
        required: false
    },

    cours: [{
        name: {
            required: true,
            type: String
        },
        credit: {
            required: true,
            type: String
        },
        profName: {
            required: false,
            type: String
        }
    }]

});


module.exports = mongoose.model('University', UniversitySchema); // on ajoute cette Schema dnas la base de donnee