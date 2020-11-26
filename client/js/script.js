const socketClient = io();
//on va stocker les autres utilisateurs connectés dans un tableau
let users = [];

//on définit un utilisateur fictif pour faire du broadcast
const defaultUser = {username: 'Tous les users', id: 'all'}

//on prévoit de stocker le destinataire des événtuels messages
let current = defaultUser;

const conversations = {};

// ici on connect et on interagie avec le html
socketClient.on('welcom', (message) => {
    // on va mettre a jour le h1
    const h1 = document.querySelector('h1');
    h1.textContent = message;
    //on affiche le formulaire de connexion
    const loginform = document.getElementById('login');
    loginform.classList.remove('hidden');
    loginform.addEventListener('submit', event => {
        //empeche le rechergement d ela page
        event.preventDefault();
        //on récupère la saisie de l'utilisateur
        const username = document.getElementById('username').value;
        //on masque le formulaire de login
        loginform.classList.add('hidden');
        //on affiche la fenêtre de chat
        const chatWindows = document.getElementById('chat');
        chatWindows.style.display = 'flex';
        //on met à jour le h2 de cette fenêtre avec le nom de l'utilisateur

        const chatTitle = document.getElementById('chatTitle');
        chatTitle.textContent = `Emetteur : ${username}`;
        
        //on récupère le formulaire d'envoi de message pour lui coller un EventListener sur l'événement submit
        const messageForm = document.getElementById('messageForm');
        messageForm.addEventListener('submit', sendMessage);

        
        
        //on prévient le serveur qu'un utilisateur vient de se connecter en emettant un événement 'login'
        
        socketClient.emit('login', {username});
    });
})

socketClient.on('connectedUsers', obj => {
    console.log(obj.connected);
    //on met à jour la liste des utilisateurs en nous excluant 
    users = obj.connected.filter(el => el.id !== socketClient.id);
    //on met à jour la div des utilisateurs
    fillUsersDiv();
});

socketClient.on('newUser', obj => {
    // on vérifie que le nouvel utilisateur, n'est pas déjà present
    if (!users.find(el => el.id === obj.data.id)) {
        users.push(obj.data);
    }
    console.log('utilisateur connecté:', users);
    fillUsersDiv();
});

socketClient.on('message', message => {
    console.log('message reçu de', message.from);
    conversations[message.from].push(message);
    if (current.id === message.from) {
        const messageDiv = createMessage(message);
        const messages = document.getElementById('messages');
        messages.appendChild(messageDiv);
    }
});

const showConversation = (userId) => {
    const messages = document.getElementById('messages');
    messages.innerHTML = '';
    const conservation = conversations[userId];
    for (const message of conservation) {
        messages.appendChild(createMessage(message));
    }

};

const createMessage = message => {
    const div = document.createElement('div');
    div.textContent = message.text;
    div.classList.add('message', message.from === socketClient.id ? 'message--from' : 'message--to');
    return div;
}

const sendMessage = event => {
    event.preventDefault();
     //on va construire un object message avec :
    // - le texte
    // - l'émetteur
    //- le destinataire
    const text = document.getElementById('message').value;
    const message = {
        from: socketClient.id,
        to: current.id,
        text
    };
    // ajouter ce nouveau message dans l'interface de l'émetteur
    const messagesDiv = document.getElementById('messages');
    messagesDiv.appendChild(createMessage(message));
    //on ajoute le message a la conversation avec cet utilisateur
    conversations[current.id].push(message);


// on envoie le message au serveur avec un emit
socketClient.emit(current.id === 'all' ? 'broadcast' : 'private', message);
}


const fillUsersDiv = () => {
    //on récupère la div des utilisateurs
    const div = document.getElementById('users');
    div.innerHTML = '';
    div.appendChild(createUser(defaultUser));
    for (const user of users) {
        //pour chaque utilisateur connecté, on va ajouter un élément html dans la div
        div.appendChild(createUser(user));
    }
    document.getElementById('messagesTitle').textContent = `Destinataire : ${current.username}`;
};

const createUser = user => {
    const userDiv = document.createElement('div');
    userDiv.classList.add('user');
    userDiv.textContent = user.username;
    if (current.id === user.id) {
        userDiv.classList.add('active');
    }

    //on ajoute une conversation pour l'utilisateur qu'on est en train d'ajouter
    if (!conversations[user.id]) {
        conversations[user.id] = [];
    }

    userDiv.addEventListener('click', event => {
        current = user;
        //on ajoute la classe active au destinataire courant
        document.querySelector('.user.active').classList.remove('active');
        event.target.classList.add('active');
        //on met également à jour le texte de la div messagesTitle
        document.getElementById('messagesTitle').textContent = `Destinataire : ${current.username}`;
        showConversation(current.id);

    })
    return userDiv;
}