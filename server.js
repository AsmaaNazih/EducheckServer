const http = require('http');
const app = require('./app');
app.set('port',process.env.PORT || 3000)
const server= http.createServer(app);

const bodyParser = require('body-parser');

// Middleware pour parser le corps de la requête
app.use(bodyParser.json({ limit: '10mb' })); // Limite de taille de 10 Mo
app.use(bodyParser.urlencoded({ extended: true }));

server.listen(3000);