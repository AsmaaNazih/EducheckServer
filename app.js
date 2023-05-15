const express = require('express');

const mongoose = require('mongoose');

const app = express();

mongoose.connect('mongodb+srv://yasserelmellali11:Educheck@cluster0.k8blwbm.mongodb.net/?retryWrites=true&w=majority',
  { useNewUrlParser: true,
    useUnifiedTopology: true })
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));


var data = JSON.stringify({
      "collection": "users",
      "database": "test",
      "dataSource": "Cluster0",
      "projection": {
          "_id": 1
      }
});
              
app.use(express.json());


app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  next();
});

const User=require('./models/Users');
const University = require('./models/University');


app.use('/api/users', (req, res, next) => {   // pour avoir la liste des toutes les Users
    User.find()
      .then(users => res.status(200).json({Item : [  users ]}))
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
        
        res.status(200).json({items : [{ status : true }]});
      })
      .catch(error => res.status(500).json({ error }));
  }); 

app.put('/api/modifieUserPassword', (req, res, next) => {
  User.updateOne({ mail: req.body.mail , password: req.body.password }, { password: req.body.password1 })
    .then(() => res.status(200).json({ Item: [ {message : 'User password modfie !'} ] }))
    .catch(error => res.status(400).json({ error }));

});

app.delete('/api/deleteUser/:mail', (req, res, next) => {
  User.deleteOne({ mail: req.params.mail })
    .then(() => res.status(200).json({ Item: [ {message : 'User supprimé !'} ] }))
    .catch(error => res.status(400).json({ error }));
});

app.post('/api/addUser', (req, res, next) => {  // requete post pour ajouter un User
    const user = new User({
      ine: req.body.ine,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      status: req.body.status,  
      password:"",
      mail: req.body.mail,


    });
    user.save()
      .then(() => res.status(201).json({ Item: [ {message : 'User enregistre !'} ] }))
      .catch(error => res.status(400).json({ error }));
  });

  app.post('/api/addUni', (req, res, next) => {  // requete post pour ajouter un User
    const university = new University({
      name: req.body.name,
      suffixe: req.body.suffixe,
      path: req.body.path
    });
    university.save()
      .then(() => res.status(201).json({ Item : [ {statut : true} ]}))
      .catch(error => res.status(400).json({ error }));
  });

  app.use('/api/allUni',(req, res, next) => {   // pour avoir la liste des toutes les Universities
    University.find()
      .then(universities => res.status(200).json({Item :  universities  }))
      .catch(error => res.status(400).json({ error }));
  });
  
  app.put('/api/addUniPath/:id', (req, res, next) => {
    University.findOneAndUpdate(
      { _id : req.params.id }, // Search for the document by its name field
      { $push: { paths: { name: req.body.pathName } } }, // Add the new path to the paths array
      { new: true } // Return the updated document instead of the original document
  )
  .then(() => res.status(200).json({ Item: [ {message : 'path ajoute !'} ] }))
  .catch(error => res.status(400).json({ error }));
  });
  
  app.delete('/api/deleteUni/:id', (req, res, next) => {
    University.deleteOne({ _id:req.params.id })
      .then(() => res.status(200).json({ Item: [ {message : 'University supprimé !'} ] }))
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


module.exports = app;

