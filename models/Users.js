const mongoose= require('mongoose');

const usersSchema = mongoose.Schema({

    ine : { 
        type:String, 
        required: true
     },

    firstName : {
        type:String, 
        required: true 
     },

    lastName : {
        type:String,
        required: true
     },

    mail : {
        type:String, 
        required: true
    },
    password:{
        type:String,
        required: false
    },  
    status: {
        type: String,
        enum: ['teacher', 'admin', 'student'], // Add enum property
        required: true
      },

    token: {
        type: String,
        required: false
        
    },

    valide: {
        type: String,
        enum: ['true','false'],
        required:true
    }

});




module.exports = mongoose.model('User', usersSchema); // on ajoute cette Schema dnas la base de donnee