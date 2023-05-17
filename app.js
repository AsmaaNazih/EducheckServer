const express = require('express');

const mongoose = require('mongoose');

const nodemailer = require('nodemailer');

const app = express();

mongoose.connect('mongodb+srv://yasserelmellali11:Educheck@cluster0.k8blwbm.mongodb.net/?retryWrites=true&w=majority',
  { useNewUrlParser: true,
    useUnifiedTopology: true })
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));

              
app.use(express.json());


app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  next();
});

/**
 * const express = require('express');
 * const mongodb = require('mongodb');
 * const nodemailer = require('nodemailer');
 * const app = express();
 * const MongoClient = mongodb.MongoClient;
 * const uri = 'mongodb+srv://yasserelmellali11:Educheck@cluster0.k8blwbm.mongodb.net/mydatabase?retryWrites=true&w=majority';
 *
 * MongoClient.connect(uri, {
 *   useNewUrlParser: true,
 *   useUnifiedTopology: true
 * }, (err, client) => {
 *   if (err) {
 *     console.log('Connexion à MongoDB échouée !', err);
 *   } else {
 *     console.log('Connexion à MongoDB réussie !');
 *     const db = client.db('mydatabase');
 *
 *     // Continue with your database operations here using the db variable
 *
 *     client.close();
 *   }
 * });
 *
 * app.use(express.json());
 * @type {unknown}
 */

const User=require('./models/Users');
const University = require('./models/University');



//################################################### Fonctions ###################################################################
function generateRandomString(x) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.-@/!;,:°#*%$£%&/()=?';
  let randomString = '';

  for (let i = 0; i < x; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomString += characters.charAt(randomIndex);
  }

  return randomString;
}
async function sendPasswordEmail(email, password) {
  // Create a transporter object using your email service details
  let transporter = nodemailer.createTransport({
    host: 'smtp.free.fr',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: 'pierreedouardhermenier@free.fr',
      pass: 'gmailintranet35'
    }
  });

  // Define the email options
  let mailOptions = {
    from: 'pierreedouardhermenier@free.fr',
    to: email,
    subject: 'Password Reset',
    text: 'Your new password is: ' + password
  };

  try {
    // Send the email
    let info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}








app.use('/api/users', (req, res, next) => {   // pour avoir la liste des toutes les Users
    User.find()
      .then(users => res.status(200).json({items : [  users ]}))
      .catch(error => res.status(400).json({ error }));
  });

  app.get('/api/findUser/:mail/:password', (req, res, next) => {  //on cherche un user par ça mail et son password
    const { mail, password } = req.params;
    console.log("service : findUser(mail,password)")
    User.findOne({ mail })
      .then(user => {
        if (!user) {
          return res.status(404).json({items : [{ status : false }]});
        }
        
        res.status(200).json({items : [{ status : true, valide: JSON.parse(user.valide) }]});
      })
      .catch(error => res.status(500).json({ error }));
  }); 

app.put('/api/modifieUserPassword', (req, res, next) => {
  User.updateOne({ mail: req.body.mail , password: req.body.password }, { password: req.body.password1 })
    .then(() => res.status(200).json({ items: [ {message : 'User password modfie !'} ] }))
    .catch(error => res.status(400).json({ error }));

});

app.delete('/api/deleteUser/:mail', (req, res, next) => {
  User.deleteOne({ mail: req.params.mail })
    .then(() => res.status(200).json({ items: [ {message : 'User supprimé !'} ] }))
    .catch(error => res.status(400).json({ error }));
});

app.post('/api/addUser', (req, res, next) => {  // requete post pour ajouter un User
  if(req.body.status=='student'){
    valid = false
  }else{
    valid = true
  }
    const user = new User({
      ine: req.body.ine,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      status: req.body.status,  
      password: generateRandomString(8),
      mail: req.body.mail,
      valide: valid


    });
    user.save()
      .then(() => res.status(201).json({ items: [ {message : 'User enregistre !'} ] }))
      .catch(error => res.status(400).json({ error }));
  });

  app.post('/api/addUni', (req, res, next) => {  // requete post pour ajouter un User
    const university = new University({
      name: req.body.name,
      suffixe_student: req.body.suffixe_student,
      suffixe_teacher: req.body.suffixe_teacher,
      path: req.body.path
    });
    university.save()
      .then(() => res.status(201).json({ items : [ {statut : true} ]}))
      .catch(error => res.status(400).json({ error }));
  });

  app.use('/api/allUni',(req, res, next) => {   // pour avoir la liste des toutes les Universities
    University.find()
      .then(universities => res.status(200).json({items :  universities  }))
      .catch(error => res.status(400).json({ error }));
  });
  
  app.put('/api/addUniPath/:id', (req, res, next) => {
    University.findOneAndUpdate(
      { _id : req.params.id }, // Search for the document by its name field
      { $push: { paths: { type: req.body.type ,name: req.body.pathName, referant: req.body.referant } } }, // Add the new path to the paths array
      { new: true } // Return the updated document instead of the original document
  )
  .then(() => res.status(200).json({ items: [ {message : 'path ajoute !'} ] }))
  .catch(error => res.status(400).json({ error }));
  });
  
  app.delete('/api/deleteUni/:id', (req, res, next) => {
    University.deleteOne({ _id:req.params.id })
      .then(() => res.status(200).json({ items: [ {message : 'University supprimé !'} ] }))
        .catch(error => res.status(400).json({ error }));
  });

  app.get('/api/getPaths/:suffixe', (req, res, next) => {  //on cherche un user par ça mail et son password
    University.findOne({ suffixe: req.params.suffixe })
      .then(uni => {
        if (!uni) {
          return res.status(404).json({items : [{ status : false }]});

        }
        
        res.status(200).json({items : uni.paths});
      })
      .catch(error => res.status(500).json({ error }));
  }); 

app.get('/api/resetPassword/:mail',(req,res, next) => {
User.findOne({ mail: req.params.mail})
  .then(user =>{
    if(!user) {
      return res.status(404).json({items: [{ status: false }]});
    }
    sendPasswordEmail(user.mail,user.password);
    res.status(200).json({items : [ {status: true} ]})
  })

});
module.exports = app;

