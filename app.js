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
const Cours = require('./models/Cours');
const { ObjectId } = require('mongodb');


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
        from: 'pierreedouardhermenier@free.fr',
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








app.use('/api/users/:token', (req, res, next) => {   // pour avoir la liste des toutes les Users

    User.findOne({token:req.params.token})
        .then(user => {
            User.find({uniName:user.uniName, status:"Student"})
                .then(users => res.status(200).json({items : users }))
                .catch(error => res.status(400).json({ error }));
        })
});

app.get('/api/findUser/:mail/:password', (req, res, next) => {  //on cherche un user par ça mail et son password
    const { mail, password } = req.params;
    console.log("service : findUser(mail,password)")
    User.findOneAndUpdate(
        { $and: [{ mail:mail },{password:password} ]},
        { $set: { token : generateRandomString(20)  } }, // Add the new path to the paths array
        { new: true }


    )
        .then(user => {
            if (!user) {
                return res.status(404).json({items : [{ statut : false }]});
            }

            res.status(200).json({items : [{ statut : true, valide: JSON.parse(user.valide), token: user.token,  status: user.status}]});
        })
        .catch(error => res.status(500).json({ error }));
});

app.put('/api/modifieUserPassword/:token', (req, res, next) => {
    User.updateOne({ token: req.params.token , password: req.body.password }, { password: req.body.newPassword })
        .then(() => res.status(200).json({ items: [ {message : 'User password modfie !'} ] }))
        .catch(error => res.status(400).json({ error }));

});

app.delete('/api/deleteUser/:mail', (req, res, next) => {
    User.deleteOne({ mail: req.params.mail })
        .then(() => res.status(200).json({ items: [ {message : 'User supprimé !'} ] }))
        .catch(error => res.status(400).json({ error }));
});

app.post('/api/addUser', (req, res, next) => {  // requete post pour ajouter un User
    const user = new User({
        ine: req.body.ine,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        status: req.body.status,
        password: generateRandomString(8),
        mail: req.body.mail,
        token: generateRandomString(20),
        valide: false || (req.body.status == 'Teacher')
    });
    user.save()
        .then(() => res.status(201).json({ items: [ {message : 'User enregistre !'} ] })) , sendEmail(user.mail,user.password,'first_password')
        .catch(error => res.status(400).json({ error }));
});

app.post('/api/addUni/:token', (req, res, next) => {  // requete post pour ajouter un User

    const token = req.params.token;
    // Vérifier si le token correspond à un administrateur valide
    User.findOne({ token: token })
        .then(admin => {
            if (admin.status != "Admin") {
                // Si le token ne correspond à aucun administrateur, renvoyer une erreur
                return res.status(401).json({ items : [{statut: false}] });
            }

            // Mettre à jour les champs "valide" et "uniName" de l'administrateur
            admin.valide = true;
            admin.save()
                .then(() =>{
                    const university = new University({
                        name: req.body.uniName,
                        suffixe_student: req.body.suffixe_student,
                        suffixe_teacher: req.body.suffixe_teacher,
                        path: [],
                        image: req.body.image
                    });
                    university.save()
                        .then(uni =>{
                            admin.uniName = uni._id,
                                admin.save(),
                                res.status(201).json({ items :  [uni] })})
                        .catch(error => res.status(400).json({ error }));
                });
        });
});


app.get('/api/getUniversity/:token', (req, res, next) => {  //on récupère tous les parcours
    User.findOne({token:req.params.token})
        .then(user =>
            University.findOne({ _id: user.uniName })
                .then(uni => {
                    if (!uni) {
                        return res.status(404).json({items : [{ statut : false }]});

                    }
                    console.log(uni.name)
                    res.status(200).json({items : [uni]});
                })
                .catch(error => res.status(500).json({ error }))
        )
        .catch(error => res.status(404).json({items : [{statut : false}]}))
});

app.use('/api/allUni',(req, res, next) => {   // pour avoir la liste des toutes les Universities
    University.find()
        .then(universities => res.status(200).json({items :  universities  }))
        .catch(error => res.status(400).json({ error }));
});

app.put('/api/addUniPath/:token', (req, res, next) => {
    const token = req.params.token;

    // Vérifier si le token correspond à un administrateur valide
    User.findOne({ token: token })
        .then(admin => {
            if (admin.status != "Admin") {
                // Si le token ne correspond à aucun administrateur, renvoyer une erreur
                return res.status(401).json({ items : [{statut: false}] });
            }
            University.findOneAndUpdate(
                { name : req.body.uniName }, // Search for the document by its name field
                { $push: { paths: { type: req.body.type ,name: req.body.pathName, referant: req.body.referant } } }, // Add the new path to the paths array
                { new: true } // Return the updated document instead of the original document
            )
                .then(() => res.status(200).json({ items: [ {message : 'add path !'} ] }))
                .catch(error => res.status(400).json({ error }));

        });
});

app.put('/api/editAcademicBackground/:token', (req, res, next) => {
    const token = req.params.token;
    const id = new ObjectId(req.body._idPath);

    // Vérifier si le token correspond à un administrateur valide
    User.findOne({ token: token })
        .then(admin => {
            if (admin.status != "Admin") {
                // Si le token ne correspond à aucun administrateur, renvoyer une erreur
                return res.status(401).json({ items : [{statut: false}] });
            }

            University.findOneAndUpdate(
                {
                    _id: admin.uniName,
                    "paths._id": id  // Check if the id exists in the paths array
                },
                {
                    $set: {
                        "paths.$.type": req.body.type,
                        "paths.$.name": req.body.pathName,
                        "paths.$.referant": req.body.referant
                    }
                }
            )
                .then(result => {
                    if (result) {
                        // Path updated successfully
                        return res.status(200).json({ items: [{ message : 'change path !' }] });
                    } else {
                        // No path found with the provided id
                        return res.status(404).json({ items: [{ message: 'Path not found' }] });
                    }
                })
                .catch(error => res.status(400).json({ error }));
        });
});

app.delete('/api/deleteAcademicBackground/:token', (req, res, next) => {
    const token = req.params.token;
    const id = new ObjectId(req.body._idPath);

    // Vérifier si le token correspond à un administrateur valide
    User.findOne({ token: token })
        .then(admin => {
            if (admin.status != "Admin") {
                // Si le token ne correspond à aucun administrateur, renvoyer une erreur
                return res.status(401).json({ items : [{statut: false}] });
            }

            University.findOneAndUpdate(
                {
                    _id: admin.uniName,
                    "paths._id": id  // Check if the id exists in the paths array
                },
                {
                    $pull: {
                        paths: { _id: id }
                    }
                }
            )
                .then(result => {
                    if (result) {
                        // Path updated successfully
                        return res.status(200).json({ items: [{ message : 'deleted path !' }] });
                    } else {
                        // No path found with the provided id
                        return res.status(404).json({ items: [{ message: 'Path not found' }] });
                    }
                })
                .catch(error => res.status(400).json({ error }));
        });
});

app.delete('/api/deleteUni/:id', (req, res, next) => {
    University.deleteOne({ _id:req.params.id })
        .then(() => res.status(200).json({ items: [ {message : 'University supprimé !'} ] }))
        .catch(error => res.status(400).json({ error }));
});

app.put('/api/editUniversity/:token',(req, res, next) => {
    const id = new ObjectId(req.body._idUni);
    User.findOne({token:req.params.token})
        .then(admin=> {
            if(admin.status!="Admin"){
                return res.status(404).json({ items: [{ message: 'no admin account'}]})
            }
            University.findOneAndUpdate(
                {_id : id},
                {$set:{
                        "name":req.body.uniName,
                        "suffixe_student":req.body.suffixe_student,
                        "suffixe_teacher": req.body.suffixe_teacher,
                        "image": req.body.image
                    }}
            ).then(result => {
                if (result) {
                    // Path updated successfully
                    return res.status(200).json({ items: [{ message : 'Change university !' }] });
                } else {
                    // No path found with the provided id
                    return res.status(404).json({ items: [{ message: 'University not found' }] });
                }
            })
                .catch(error => res.status(400).json({ error }));
        });
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

app.put('/api/pathStudent/', (req, res, next) => {
    const idUni = req.body._idUni;
    const idPath = req.body._idPath;

    University.findOne({ _id: idUni })
        .then(uni => {
            if (!uni) {
                console.log("uni_not_found");
                return res.status(404).json({ items: [{ error: "UNI_NOT_FOUND" }] });
            }

            User.findOneAndUpdate(
                { mail: req.body.mail },
                {
                    $set: {
                        uniName: idUni
                    },
                    $push: {
                        'path': { id: idPath } // Add a new element to the path array with the provided id
                    }
                },
                { new: true }
            )
                .then(user => {
                    if (!user) {
                        console.log("user_not_found");
                        return res.status(404).json({ items: [{ error: "USER_NOT_FOUND" }] });
                    }

                    res.status(200).json({ items: [{ status: true, message: 'path updated!' }] });
                })
                .catch(error => res.status(500).json({ error }));
        })
        .catch(error => res.status(500).json({ error }));
});

app.put('/api/pathTeacher/:token', (req, res, next) => {  //on cherche un user par ça mail et son password
    console.log(req.body.mail)
    console.log(req.body.type)
    console.log(req.body.name )

    University.findOne({_id:req.body._idUni,'paths.name':req.body.name,'paths.type':req.body.type })
        .then(uni => {
            if(!uni){
                console.log("uni_not_found")
                return res.status(404).json({items : [{ error : "UNI_NOT_FOUND" }]});
            }
            User.findOneAndUpdate(
                {  mail: req.body.mail,status: 'Teacher',token:req.params.token },
                { $push: { uniName: req.body._idUni, path: uni.paths.find(p => p.name === req.body.name && p.type === req.body.type)._id  } }, // Add the new path to the paths array
                { new: true } // Return the updated document instead of the original document
            )
                .then(user => {

                    if (!user) {
                        console.log("user_not_found")
                        return res.status(404).json({items : [{ error : "USER_NOT_FOUND" }]});

                    }

                    res.status(200).json({items : [{ statut : true,message: 'path updated!'}]});
                })
                .catch(error => res.status(500).json({ error }))
                .catch(error => res.status(500).json({ error }));

        })
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



app.post('/api/sendMessageTo/:token', (req, res, next) => {  // requete post pour ajouter un User
    User.findOneAndUpdate({
            $and:[ {token: req.params.token, mail: req.body.mailSender } ] },
        { $push: { messages: {mailRecipient: req.body.mailRecipient ,mailSender: req.body.mailSender, message:req.body.message,date: req.body.date     } } }, // Add the new path to the paths array
        { new: true } // Return the updated document instead of the original document

    )
        .then(user =>{
            if(!user) {
                return res.status(404).json({items: [{ statut: false, message: 'User not Found' }]});
            }

            User.findOneAndUpdate(
                { mail: req.body.mailRecipient } ,
                { $push: { messages: {mailRecipient: req.body.mailRecipient ,mailSender: req.body.mailSender, message:req.body.message,date: req.body.date     } } }, // Add the new path to the paths array
                { new: true } // Return the updated document instead of the original document

            )
                .then(user => {
                    if (!user) {
                        return res.status(404).json({items: [{statut: false, message: 'User not Found'}]});
                    }
                    res.status(200).json({items: [{message: 'Message sent with success !'}]})
                })
                .catch(error => res.status(400).json({ error }))


        })
        .catch(error => res.status(400).json({ error }));
});


app.get('/api/getCourses/:token', (req, res, next) => {
    User.findOne({ token: req.params.token })
        .then(user => {
            if (!user) {
                return res.status(404).json({ items: [{ statut: false, message: 'The user was not found' }] });
            }
            University.findOne({ _id: user.uniName })
                .then(uni => {
                    if (!uni) {
                        console.log("uni_not_found");
                        return res.status(404).json({ items: [{ error: "UNI_NOT_FOUND" }] });
                    }

                    const path = uni.paths.find(path => path._id.toString() === user.path[0].id);
                    const cours = path ? path.cours : [];

                    return res.status(201).json({ items: [{ cours }] });
                })
                .catch(error => res.status(500).json({ error }));
        })
        .catch(error => res.status(500).json({ error }));
});

app.post('/api/setCourses/:token', (req, res, next) => {
    const id = new ObjectId(req.body._id);

    User.findOne({ $and: [{ token: req.params.token, status: 'Teacher' }] })
        .then(user => {
            if (!user) {
                console.log("User nor Found")
                return res.status(404).json({ items: [{ statut: false, message: 'User not Found' }] });
            }

            University.findOneAndUpdate(
                {
                    _id: user.uniName,
                    'paths._id': id// Search for the path by name
                },
                {
                    $push: {
                        'paths.$.cours': {
                            name: req.body.name,
                            credit: req.body.credit,
                            profName: req.body.profName
                        }
                    }
                },
                { new: true } // Return the updated document instead of the original document
            )
                .then(uni => res.status(201).json({ items : [{ statut : true,message: 'Course Added!'}]}))
                .catch(error => res.status(400).json({ error }));
        });
});


app.post('/api/postCoursesStudent/:token', (req, res, next) => {
    const emails = req.body.mail;

    User.findOne({ $and: [{ token: req.params.token, status: 'Teacher' }] })
        .then(user => {
            if (!user) {
                console.log("User nor Found")
                return res.status(404).json({ items: [{ statut: false, message: 'User not Found' }] });
            }

            for (let i = 0; i < emails.length; i++) {
                const email = emails[i];
                User.findOneAndUpdate(
                    {
                        mail: email,
                        'path.id': req.body._idPath
                    },
                    {
                        $push: {
                            'path.$.cours': {
                                idCour: req.body._idCourse
                            }
                        }
                    },
                    { new: true }
                )
                    .catch(error => {
                        console.log(error);
                    });
            }
        });
});



app.get('/api/retrieveMessages/:token',
    (req, res, next) => {
        console.log(req.params.token);
        User.findOne({token: req.params.token})
            .then(user => {
                if (!user) {
                    return res.status(404).json({items: [{statut: false, message: 'User not found'}]});
                }
                console.log(user.messages)
                return res.status(200).json({items: [ { mailSenders :user.messages.map(message => message.mailSender),mailRecipients :user.messages.map(message => message.mailRecipient), messages: user.messages.map(message => message.message), statut: true} ]});


            })
            .catch(error => res.status(404).json({items : [{statut : false}]}))
    });

app.get('/api/sendMexTo/:token', (req, res, next) => {  //on récupère tous les parcours
    User.findOne({token:req.params.token})
        .then(user =>
            User.find({
                'path.id': user.path[0].id,
                uniName: user.uniName })
                .then(users =>
                    res.status(200).json({items : [ { mail:users.map(user=> user.mail) } ] } )
                )


        )
        .catch(error => res.status(404).json({items : [{statut : false}]}))
});

app.get('/api/getNotes/:token', (req, res, next) => {
    User.findOne({ token: req.params.token })
        .then(user => {
            if (!user) {
                return res.status(404).json({ items: [{ statut: false, message: 'User not found' }] });
            }
            res.status(200).json({ items: [{ notes: user.notes }] });

        })
        .catch(error => res.status(404).json({ items: [{ statut: false }] }));
});


app.post('/api/addNotes/:token', (req, res, next) => {  //on récupère tous les parcours
    User.findOneAndUpdate({token:req.params.token},
        { $push: { notes: {note:req.body.note,type:req.body.type,nameCours:req.body.nameCours,nameEtudiant:req.body.mailEtudiant } } }, // Add the new path to the paths array
        { new: true }
    )
        .then(user => {
            if (!user|| user.status!=='Teacher') {
                return res.status(404).json({items: [{statut: false, message: 'This user is not allowed to give marks!'}]});
            }
            /* req.body.mailEtudiant
               req.body.note
               req.body.type
               req.body.nameCours
             */
            User.findOneAndUpdate(
                {  mail:req.body.mailEtudiant },
                { $push: { notes: {note:req.body.note,type:req.body.type,nameCours:req.body.nameCours,nameProf:user.mail } } }, // Add the new path to the paths array
                { new: true }


            )
                .then(u => {
                    if (!u) {
                        return res.status(404).json({items : [{ statut : false }]});
                    }

                    res.status(200).json({items : [{ statut : true, notes: u.notes }]});
                })
                .catch(error => res.status(500).json({ error }));


        })
        .catch(error => res.status(404).json({items : [{statut : false}]}))
});




module.exports = app;

