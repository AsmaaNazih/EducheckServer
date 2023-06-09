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
        enum: ['Teacher', 'Admin', 'Student'], // Add enum property
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
    },

    path: [{
        _id:false,
        id:{
            type: String,
            required:true
        },
        cours: [{
            idCour: {
                type:String,
                required: false
            }
        }]
    }],


    uniName: {
        type:String,
        required: false
    },


    messages: [{

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

    }],

    notes: [{

        nameEtudiant:{
          type:String,
          required:false
        },

        nameCours: {
            type: String,
            required: true
        },

        type: {
            type: String,
            required: true

        },

        note: {
            type: String,
            required:true
        },

        nameProf: {
            type: String,
            required:false
        }

    }]
});




module.exports = mongoose.model('User', usersSchema); // on ajoute cette Schema dnas la base de donnee