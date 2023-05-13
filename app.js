const express = require('express');

const mongoose = require('mongoose');

const app = express();


const axios = require('axios');

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
              
var config = {
    method: 'post',
    url: 'https://eu-west-2.aws.data.mongodb-api.com/app/data-qsbjf/endpoint/data/v1',
    headers: {
        'Content-Type': 'application/json',
        'Access-Control-Request-Headers': '*',
        'api-key': '645e64b73f6e0e323d98b690',
        'Accept': 'application/ejson'
    },
    data: data
};
              
axios(config)
    .then(function (response) {
        console.log(JSON.stringify(response.data));
    })
    .catch(function (error) {
        console.log(error);
    });
  

app.use(express.json());


app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  next();
});

const User=require('./models/Users');


app.use('/api/users', (req, res, next) => {   // pour avoir la liste des toutes les Users
    User.find()
      .then(users => res.status(200).json(users))
      .catch(error => res.status(400).json({ error }));
  });

  app.get('/api/findUser/:mail/:password', (req, res, next) => {  //on cherche un user par ça mail et son password
    const { mail, password } = req.params;
  
    User.findOne({ mail })
      .then(user => {
        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }
        
        res.status(200).json(user);
      })
      .catch(error => res.status(500).json({ error }));
  });

app.put('/api/modifieUserPassword', (req, res, next) => {
  User.updateOne({ mail: req.body.mail , password: req.body.password }, { password: req.body.password1 })
    .then(() => res.status(200).json({ message: 'Users password modifié !'}))
    .catch(error => res.status(400).json({ error }));

});

app.delete('/api/deleteUser/:mail', (req, res, next) => {
  User.deleteOne({ mail: req.params.mail })
    .then(() => res.status(200).json({ message: 'User supprimé !'}))
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
      .then(() => res.status(201).json({ message: 'User enregistré !'}))
      .catch(error => res.status(400).json({ error }));
  });



module.exports = app;

