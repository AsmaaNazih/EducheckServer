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


app.use('/api/users', (req, res, next) => {   // pour avoir tous les Users
    User.find()
      .then(users => res.status(200).json(users))
      .catch(error => res.status(400).json({ error }));
  });

  app.get('/api/findUser/:mail/:password', (req, res, next) => {
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

app.get('/api/users',(req,res , next )=>{
const users =
    [
        {
            
            ine : '07IS8U00BS0',
        
            firstName : 'El Mellali',
        
            lastName : 'Yasser',
        
            mail : 'yasserelmellali11@gmail.com',
        
            status: 'teacher',
        },
        {
    
            ine : '07IS8U11BS0',
        
            firstName : 'Hassan',
        
            lastName : 'Issa',
        
            mail : 'HassanIssa@gmail.com',
        
            status: 'student',
        }
    ];
    User.insertMany(users)
    users.save()
    .then(result => {
      console.log(result);
      res.status(201).json({ message: 'Users added successfully' });
    })
    .catch(error => {
      console.log(error);
      res.status(500).json({ error });
    });
});

app.post('/api/addUser', (req, res, next) => {
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
    

 /*     const user = new User({
    ine: '07IS8U00BS0',
    firstName: 'El Mellali',
    lastName: 'Yasser',
    mail: 'yasserelmellali11@gmail.com',
    status: 'teacher',
    password: 'ciao'
});

user.save()
    .then(result => {
        console.log(result);
        res.status(201).json({
            message: 'User created successfully',
            user: result
        });
    })
    .catch(error => {
        console.log(error);
        res.status(500).json({
            error: error
        });
    });
*/
  });



module.exports = app;

