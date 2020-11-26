const express = require('express');
const io = require('socket.io');
//module de base inclus dans l'installation de node, permet de faire un serveur http
const http = require('http');
//également intégré à l'installation de node, permet de manipuler le système de fichier
const path = require('path');



const app = express();
//on englobe notre app express dans un serveur http créé avec le module http
const server = http.createServer(app);
//mise en place du serveur de sockets en utilisant le package socket.io
const socketServer = io(server);


app.use(express.static(path.join(__dirname, '../client')));

const connectedUsers = () => {
    const connected = []
    //on va parcourir la liste des sockets du serveur
    for (const key of socketServer.sockets.sockets.keys()) {
        //on va vérifier pour chaque socket s'il a une propriété username
        const current = socketServer.sockets.sockets.get(key);
        if (current.username) {
            //si cette propriété est présente, l'utilisateur est connecté, on l'ajoute à la liste
            connected.push({id: key, username: current.username});
        }
    }
    return connected;
};
//'connection' est déclenché automatiquement lors de l'ouoverture du socket par le client

socketServer.on('connection', socket => {
    //pour défénir d'autres événement à surveiller, on utilise le socket fourni par l'API au moment de l'événement 'connection'

    console.log('Un client s\'est connecté au socketServer')
    //on evoie un événement 'welcome' pour mettre à jour le h1 de la page du client

    socket.emit('welcom', 'bienvenue sur le oChat');
    //à la réception d'un événement 'login'
    socket.on('login', obj => {
        console.log('Reçu sur l\'event login', obj);
        //on va stocker dans le socket le nom de l'utilisateur
        socket.username = obj.username;
        //on va récupérer la liste de tous les utilisateurs connectés
        const connected = connectedUsers();
        //on envoie à l'utilisateur qui vient de se connecter le tableau des utilisateurs connectés
        socket.emit('connectedUsers', {connected});

        //on va prévenir tous les autres utilisateurs qu'un nouvel utilisateur vient de se connecter
        socket.broadcast.emit('newUser', {data: {id: socket.id, username: socket.username}});
    });

    socket.on('broadcast', message => {
        //on envoie le message reçu à tous les utilisateurs sauf à l'émetteur
        socket.broadcast.emit('message', message);
    });

    socket.on('private', message => {
        //on envoie le message seul
        socket.to(message.to).emit('message', message);
    });
});



server.listen(3500, () => {
    console.log('Server started on port 3500');
});