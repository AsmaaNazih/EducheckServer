const mongoose= require('mongoose');

const messageSchema = mongoose.Schema({

    mailRecipient: {
        type: String,
        required: true
    },

    mailSender: {
        type: String,
        required: true

    },

    message: {
        type: String,
        required:true
    },

    date: {
        type: Date,
        required: false
    }

});




module.exports = mongoose.model('Message', messageSchema); // on ajoute cette Schema dnas la base de donnee