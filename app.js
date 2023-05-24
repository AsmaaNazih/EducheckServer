const express = require('express');

const mongoose = require('mongoose');

const nodemailer = require('nodemailer');

const app = express();

const bodyParser = require('body-parser');

// Middleware pour parser le corps de la requête
app.use(bodyParser.json({ limit: '20mb' })); // Limite de taille de 10 Mo
app.use(bodyParser.urlencoded({ extended: true }));

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


const User=require('./models/Users');
const University = require('./models/University');
const Message = require('./models/Message');



//################################################### Fonctions ###################################################################
function generateRandomString(x) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomString = '';

  for (let i = 0; i < x; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomString += characters.charAt(randomIndex);
  }

  return randomString;
}
async function sendEmail(email, password, type) {
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
  let subject;
  let text;
  if(type === 'validToken'){
    subject='Validate your account'
    text= 'you have to go to this url : http://localhost:3000/api/sendToken/'+password
  }else if(type==='first_password'){
    subject='Your Password'
    text= 'you can connect with the following password '+ password
  }
  // Define the email options
  let mailOptions = {
    from: 'noreply@educheck.fr',
    to: email,
    subject: subject,
    text: text
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
          return res.status(404).json({items : [{ statut : false }]});
        }
        
        res.status(200).json({items : [{ statut : true, valide: JSON.parse(user.valide), token: user.token,  status: user.status}]});
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
  let valid;
  valid = req.body.status !== 'Student';
    const user = new User({
      ine: req.body.ine,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      status: req.body.status,  
      password: generateRandomString(8),
      mail: req.body.mail,
      token: generateRandomString(20),
      valide: valid


    });
    user.save()
      .then(() => res.status(201).json({ items: [ {message : 'User enregistre !'} ] })) , sendEmail(user.mail,user.password,'first_password')
      .catch(error => res.status(400).json({ error }));
  });

  app.post('/api/addUni/:token', (req, res, next) => {  // requete post pour ajouter un User
    const university = new University({
      name: req.body.name,
      suffixe_student: req.body.suffixe_student,
      suffixe_teacher: req.body.suffixe_teacher,
      path: [],
      image: req.body.image
    });
    university.save()
      .then(uni => res.status(201).json({ items :  uni }))
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

  app.get('/api/getPaths/:suffixe', (req, res, next) => {  //on récupère tous les parcours
    University.findOne({ suffixe_teacher: req.params.suffixe })
      .then(uni => {
        if (!uni) {
          return res.status(404).json({items : [{ statut : false }]});

        }
        res.status(200).json({items : uni.paths});
      })
      .catch(error => res.status(500).json({ error }));
  });


app.put('/api/pathStudent/', (req, res, next) => {  //on cherche un user par ça mail et son password
  console.log(req.body.name)
  console.log(req.body.uniName)
  console.log(req.body.type)
  User.findOneAndUpdate(
      {  mail: req.body.mail },
      { $push: { uniName: req.body.uniName, path: { type: req.body.type ,name: req.body.name } } }, // Add the new path to the paths array
       { new: true } // Return the updated document instead of the original document
  )
      .then(user => {

        if (!user) {
          console.log("user_not_found")
          return res.status(404).json({items : [{ error : "USER_NOT_FOUND" }]});

        }

        res.status(200).json({items : [{ statut : true}]});
      })
      .catch(error => res.status(500).json({ error }));
});

app.get('/api/resetPassword/:mail',(req,res, next) => {
User.findOne({ mail: req.params.mail})
  .then(user =>{
    if(!user) {
      return res.status(404).json({items: [{ statut: false }]});
    }
    sendEmail(user.mail,user.password,'first_password');
    res.status(200).json({items : [ {statut: true} ]})
  })

});

app.get('/api/sendValidToken/:mail',(req,res,next) => {
  User.findOne( { mail: req.params.mail})
      .then(user =>{
        if(!user){
          return res.status(404).json({items: [{ statut: false }]});
        }
        sendEmail(user.mail,user.token,'validToken')
        return res.status(200).json( {items: [ {statut: true}]})

      })

});
app.get('/api/sendToken/:token',(req,res,next) => {
    console.log(req.body.token);
    User.findOneAndUpdate( { token: req.params.token},
  { $set: { valide : 'true'  } }, // Add the new path to the paths array
  { new: true }) // Return the updated document instead of the original document)
      .then(user =>{
        if(!user){
          return res.status(404).json({items: [{ statut: false }]});
        }

        return res.status(200).json( {items: [ {statut: 'Your account now is valid!'}]})

      })

})



app.post('/api/node/:token', (req, res, next) => {  // requete post pour ajouter un User
    const message = new Message({
        mailRecipient: req.body.mailRecipient,

        mailSender: req.body.mailSender,

        message: req.body.message,

        date: req.body.date

    });
    User.findOne({ token: req.params.token, mail: req.body.mailSender})
        .then(user =>{
            if(!user) {
                return res.status(404).json({items: [{ statut: false, message: 'User not Found' }]});
            }
            message.save()
                .then(() => res.status(201).json({ items: [ {message : 'Message sent with success !'} ] }))
                .catch(error => res.status(400).json({ error }));
        })

});


app.get('/api/retrieveMessages/:token',
    (req, res, next) => {
        console.log(req.params.token);
        User.findOne({token: req.params.token})
            .then(user => {
                if (!user) {
                    return res.status(404).json({items: [{statut: false, message: 'User not found'}]});
                }
                Message.find({ $or: [{ mailSender: user.mail }, { mailRecipient: user.mail }] })
                    .then(message => {
                            return res.status(200).json({items: [ message ]});
                        }
                    )

            })

    })



module.exports = app;

