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
        .catch(error => res.status(500).json({error}));
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


app.get('/api/getUsers/:token', (req, res, next) => {  //on récupère tous les parcours
    User.findOne({token:req.params.token})
        .then(user =>
            User.find({ uniName: user.uniName , status:'Student'})
                .then(u => {
                    if (!user) {
                        return res.status(404).json({items : [{ statut : false }]});

                    }
                    res.status(200).json({items : [u]});
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

app.post('/api/recMex/:token', (req, res, next) => {
    const token = req.params.token;
    const mailSender = req.body.mailSender;

    User.findOneAndUpdate(
        { token: token },
        { $pull: { 'rec': { mail: mailSender } } },
        { new: true }
    )
        .then(user => {
            if (!user) {
                return res.status(404).json({ items:[ {status: false, error: 'User not found' }] });
            }
            res.status(200).json({ items:[{ status: true, message: 'Mails removed successfully' }]});
        })
        .catch(error => {
            console.log(error);
            res.status(500).json({items:[{ status: false, error: 'Failed to remove mails' }]});
        });
});



app.post('/api/sendMessageTo/:token', (req, res, next) => {  // requete post pour ajouter un User
    User.findOneAndUpdate({
            $and:[ {token: req.params.token, mail: req.body.mailSender } ] },
        { $push: { messages: {mailRecipient: req.body.mailRecipient ,mailSender: req.body.mailSender, message:req.body.message,date: req.body.date,received:'true'     } } }, // Add the new path to the paths array
        { new: true } // Return the updated document instead of the original document

    )
        .then(user =>{
            if(!user) {
                return res.status(404).json({items: [{ statut: false, message: 'User not Found' }]});
            }
            console.log(req.body.mailRecipient)
            User.findOneAndUpdate(
                { mail: req.body.mailRecipient } ,
                {$push: {
                        messages: {
                            mailRecipient: req.body.mailRecipient,
                            mailSender: req.body.mailSender,
                            message: req.body.message,
                            date: req.body.date,
                            received: 'false'
                        },
                        rec: { mail: req.body.mailSender }
                    } }, // Add the new path to the paths array
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
                    const cours = path ? path.cours.filter(c => user.path[0].cours[0].idCour.includes(c._id)) : [];

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


app.post('/api/postCoursesStudent/:token', async (req, res, next) => {
    try {
        const emails = req.body.mail;
        console.log(req.body._idCourse)
        console.log("path id: "+req.body._idPath)

        const teacher = await User.findOne({ token: req.params.token, status: 'Teacher' });
        if (!teacher) {
            console.log("User not Found");
            return res.status(404).json({ items: [{ status: false, message: 'User not Found' }] });
        }

        const promises = emails.map(async (email) => {
            const student = await User.findOneAndUpdate(
                {
                    mail: email,
                    'path': {
                        $elemMatch: {
                            id: req.body._idPath
                        }
                    }
                },
                {
                    $push: {
                        'path.$.cours': {
                            idCour: req.body._idCourse
                        }
                    }
                },
                { new: true }
            );

            if (!student) {
                console.log(email + " Student not Found");
            } else {
                console.log(student.name + " ajout " + req.body._idCourse);
            }
        });

        await Promise.all(promises);

        return res.status(201).json({ items: [{ status: true, message: 'Course Added!' }] });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ items: [{ status: false, message: 'Internal Server Error' }] });
    }
});




app.post('/api/addAbs/:token', async (req, res, next) => {
    const emails = req.body.mailStudents;
    const promises = [];

    for (let i = 0; i < emails.length; i++) {
        const email = emails[i];
        let id_j = generateRandomString(20);
        let isUnique = false;

        while (!isUnique) {
            try {
                const existingJustificatif = await User.findOne({ 'justificatif.id_j': id_j });
                if (!existingJustificatif) {
                    isUnique = true;
                } else {
                    id_j = generateRandomString(20);
                }
            } catch (error) {
                return res.status(500).json({ items: [{ statut: false, message: 'Error id_j!' }] });
            }
        }

        const updatePromise = User.findOneAndUpdate(
            { token: req.params.token },
            {
                $push: {
                    justificatif: {
                        id_j: id_j,
                        mailStudent: email,
                        nameCours: req.body.nameCours,
                        date: req.body.date,
                        justifie: 'False'
                    }
                }
            },
            { new: true }
        )
            .then(user => {
                if (!user || user.status !== 'Teacher') {
                    return Promise.reject({ status: 404, message: 'This user is not allowed to give abs!' });
                }

                return User.findOneAndUpdate(
                    { mail: email, status: 'Student' },
                    {
                        $push: {
                            justificatif: {
                                id_j: id_j,
                                date: req.body.date,
                                nameCours: req.body.nameCours,
                                mailProf: user.mail,
                                justifie: 'False'
                            }
                        }
                    },
                    { new: true }
                );
            })
            .catch(error => Promise.reject(error));

        promises.push(updatePromise);
    }

    try {
        const results = await Promise.all(promises);

        const hasError = results.some(result => !result);
        if (hasError) {
            return res.status(404).json({ items: [{ statut: false }] });
        }

        res.status(200).json({ items: [{ statut: true, justificatif: results[0].justificatif }] });
    } catch (error) {
        const status = error.status || 500;
        const message = error.message || 'An error occurred';
        res.status(status).json({ error: message });
    }
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
                return res.status(200).json({items: [ { mailSenders :user.messages.map(message => message.mailSender),mailRecipients :user.messages.map(message => message.mailRecipient), messages: user.messages.map(message => message.message), ids:user.messages.map(message => message._id), statut: true} ]});


            })
            .catch(error => res.status(404).json({items : [{statut : false}]}))
    });

app.get('/api/sendMexTo/:token', (req, res, next) => {  //on récupère tous les parcours
    User.findOne({token:req.params.token})
        .then(user => {
            var status = (user.status === 'Teacher') ? 'Student' : 'Teacher';

            User.find({
                'path.id': user.path[0].id,
                uniName: user.uniName,
                status: status
            })
                .then(users => {


                    res.status(200).json({items: [{mail: users.map(user => user.mail)},{received:user.rec.map(r=> r.mail)}]})
                } )


        })
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


app.get('/api/getAllJust/:token', (req, res, next) => {
    User.findOne({ token: req.params.token })
        .then(user => {
            if (!user) {
                return res.status(404).json({ items: [{ statut: false, message: 'User not found' }] });
            }
            res.status(200).json({ items: [{ justif: user.justificatif }] });

        })
        .catch(error => res.status(404).json({ items: [{ statut: false }] }));
});

app.post('/api/justify/:token', (req, res, next) => {
    const { token } = req.params;
    const { id_j,studentEmail, professorEmail, imagePath } = req.body;
    console.log(token)
    User.findOneAndUpdate(
        { token:token },
        { $set: { 'justificatif.$[teacher].justifie': 'False', 'justificatif.$[teacher].image': imagePath } },
        { arrayFilters: [{ 'teacher.id_j': id_j}] }
    )
        .then(student => {
            if (!student) {
                console.log("ici")
                console.log('user not found')
                return res.status(404).json({items: [{ status: false, message: 'Student not found.' }]});
            }
            console.log(student)
            User.findOneAndUpdate(
                { mail: professorEmail },
                { $set: { 'justificatif.$[student].justifie': 'True', 'justificatif.$[student].image': imagePath } },
                { arrayFilters: [{ 'student.id_j':id_j}] }
            )
                .then(teacher => {
                    if (!teacher) {
                        console.log("là")
                        return res.status(404).json({items: [{ status: false, message: 'Teacher not found.' }]});
                    }
                    console.log(teacher)
                    res.status(200).json({items: [{ status: true, message: 'Justification updated successfully.' }]});
                })
                .catch(error => res.status(500).json({ error }));
        })
        .catch(error => res.status(500).json({ error }));
});

app.post('/api/justifyProf/:token', (req, res, next) => {
    const { token } = req.params;
    const { id_j,studentEmail } = req.body;

    User.findOneAndUpdate(
        { token:token , status: 'Teacher'},
        { $set: { 'justificatif.$[teacher].justifie': 'Accept'  } },
        { arrayFilters: [{ 'teacher.id_j':id_j}] }
    )
        .then(teacher => {
            if(!teacher){
                return res.status(400).json({items:[{message:'Teacher not found'}]})
            }

            User.findOneAndUpdate(
                    { mail: studentEmail },
                    { $set: { 'justificatif.$[teacher].justifie': 'True'  } },
                    { arrayFilters: [{ 'teacher.id_j':id_j}] }
                )
                .then(student => {
                        if (!student) {
                                return res.status(404).json({items: [{ status: false, message: 'Student not found.' }]});
                        }

                            res.status(200).json({items: [{ status: true, message: 'Justification updated successfully.' }]});
                        })
                        .catch(error => res.status(500).json({ error }));
        })

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

                    res.status(200).json({items : [{ statut : true, message: 'Mark added!' }]});
                })
                .catch(error => res.status(500).json({ error }));


        })
        .catch(error => res.status(404).json({item : [{statut : false}]}))
});




module.exports = app;

