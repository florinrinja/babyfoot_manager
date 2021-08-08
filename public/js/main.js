// --------------------------------------------------------- Global variables
const socket = io();
const chatForm = document.getElementById('chat-form');
const gameForm = document.getElementById('game-form');
const gamesList = document.getElementById('ongoing-games');
const userList = document.getElementById('users');
let checkedRadio;
let senderUser;
let firstJoin = true;

// --------------------------------------------------------- GAMES

const updateGamesCounter = () => {
    // All games number
    const currentGamesNumber = document.getElementById('ongoing-games').children.length;
    // All finished games number
    const inputs = [...document.getElementsByName('games')],
        finishedGamesCount = inputs.filter(input => input.checked).length;

    // Reset counter number
    const counter = document.getElementById('game-count');
    counter.innerHTML = '';

    // Append new counter to DOM
    const writeGamesNumber = document.createTextNode(currentGamesNumber - finishedGamesCount);
    counter.appendChild(writeGamesNumber);
};

// Game submit
gameForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Get game
    const game = e.target.elements.game.value;

    // Emit game to server
    socket.emit('new_game', game);

    // Clear input
    e.target.elements.game.value = '';
    e.target.elements.game.focus();
});

const handleDeleteGameButton = (e) => {
    // Get the input sibling with the delete button
    const [input] = [...e.target.parentElement.children].filter(sibling => sibling.nodeName == 'INPUT' && sibling.nodeType === 1);

    // Game id
    const game = {
        id: Number(input.id),
    };

    // Send to server game deletion
    socket.emit('delete_game', game);

    // Delete game locally
    e.target.parentElement.parentNode.removeChild(e.target.parentElement);
    // Update game counter
    updateGamesCounter();
};

const updateFinishedGameElement = (value) => {
    // Query elements to update
    const label = [...document.getElementById(value.id).parentElement.children].find(item => item.nodeName === 'LABEL');
    const button = [...document.getElementById(value.id).parentElement.children].find(item => item.nodeName === 'BUTTON');
    const input = [...document.getElementById(value.id).parentElement.children].find(item => item.nodeName === 'INPUT');

    // Check finished game checkbox
    input.checked = true;
    // Hide deletion button
    input.disabled =
        button.style.visibility = 'hidden';
    // Set element's color to distinguish itself from active games
    label.style.color = 'gray';
};

const handleFinishedGameCheckbox = (e) => {
    // Game id
    const game = {
        id: Number(e.target.id),
    };

    // Send to server game deletion
    socket.emit('finished_game', game);

    // Apply DOM updates for finished game
    updateFinishedGameElement(e.target);
    // Update game counter
    updateGamesCounter();
}

socket.on('game_db_finished', (game) => {
    // Apply DOM updates for finished game
    updateFinishedGameElement(game);
    // Update game counter
    updateGamesCounter();
});

const renderGame = (data) => {
    // Create container div
    const div = document.createElement('div');
    div.className = 'games';

    // Create checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.name = 'games';
    checkbox.value = data.game;
    checkbox.id = data.id;

    // Create checkbox label
    const label = document.createElement('label');
    label.className = 'ml-3 mr-3 games-label';
    label.htmlFor = data.id;
    const labelText = document.createTextNode(data.game);

    // Create delete button
    const button = document.createElement('button');
    button.innerHTML = "<i class='fas fa-trash fa-sm'></i> Delete";
    button.className = 'btn btn-danger';

    // If finished game, apply appropriate styling
    if (data.finished) {
        checkbox.checked = true;
        checkbox.disabled = true;
        label.style.color = 'gray';
        button.style.visibility = 'hidden';
    }

    // Append created elements to div
    div.appendChild(checkbox);
    label.appendChild(labelText);
    div.appendChild(label);
    div.appendChild(button);

    // Append created div to DOM element
    gamesList.appendChild(div);

    // Add listeners for completed game checkbox and delete game button 
    checkbox.addEventListener('click', handleFinishedGameCheckbox);
    button.addEventListener('click', handleDeleteGameButton);
};

const removeGame = (data) => {
    // Query game from DOM
    const game = document.getElementById(data.id);

    // Delete game
    game.parentElement.parentNode.removeChild(game.parentElement);
    // Update game counter
    updateGamesCounter();
};

// Listener on deletion from DB
socket.on('game_db_delete', (data) => removeGame(data));

// Listener on game inserted in DB
socket.on('new_game_in_db', (data) => {
    // Render game
    renderGame(data);
    // Update game counter
    updateGamesCounter();
});

// --------------------------------------------------------- CHAT

const handleChatButton = (value) =>
    document.getElementById('create-chat').disabled = value;

const handleUserCheckBox = (e) => {
    // Manage radio check/uncheck events
    if (checkedRadio == e.target) {
        e.target.checked = false;
        checkedRadio = null;
    } else {
        checkedRadio = e.target;
    }

    // Disable chat button on unchecked radio
    if (!e.target.checked) {
        return handleChatButton(true);
    }

    // Enable chat button on checked radio
    handleChatButton(false);
};

const getMessageTemplate = (messageType, data) => {
    // Set time from data object or create a new date
    const time = data.time || (new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }));
    // Set text from data object (if exists & initial = initial incomming message, if !exists = initial outgoing message)
    const initialText = (data.text && data.text === 'initial_message') ? `${data.username} wants to send you a message ` : `send a message to ${data.username}`;

    // Return initial or regular message template
    return messageType === 'initial' ?
        `<p class="meta">${data.username} <span>${time}</span></p>
        <p class="text">
            ${initialText} 
        </p>`
        :
        `<p class="meta">${data.username} <span>${time}</span></p>
        <p class="text">
            ${data.text}
        </p>`;
};

const outputMessage = (messageType, data) => {
    // Create parent div
    const div = document.createElement('div');

    // Create parent div class
    div.classList.add('message');

    // Create template and attach it to div
    div.innerHTML = getMessageTemplate(messageType, data);

    // Output div to DOM
    document.querySelector('.chat-messages').appendChild(div);
};

// Message from server
socket.on('new_message', message => {
    // Render message
    outputMessage(undefined, message);

    // Scroll down
    const chatMessages = document.querySelector('.chat-messages');
    chatMessages.scrollTop = chatMessages.scrollHeight;
});

const handleInitialPrivateMessage = (data) => {
    // Change chat background color
    document.getElementById('chat-manager').style.backgroundColor = 'antiquewhite';

    // Selectors for chat messages and chat form 
    const chatMessages = document.querySelector('.chat-messages');
    const messagesForm = document.querySelector('.chat-form-container');

    // Set chat messages and chat form visible
    chatMessages.style.visibility = 'visible';
    messagesForm.style.visibility = 'visible';

    // Render message
    outputMessage('initial', data);
};

const createChat = () => {
    // Get checked radio input
    const [input] = [...document.getElementsByName('users')].filter(element => element.checked);

    // Emit initial message to server
    socket.emit('initial_message', { to_socket_id: input.id, senderUser });
    // Perform local initial message page style/actions
    handleInitialPrivateMessage({ username: input.value });
};

// Initial message from server
socket.on('initial_message', (data) => {
    // Check the sender user radio checkbox
    document.getElementById(data.socket_id).checked = true;

    // Perform initial message page style/actions on message from server
    handleInitialPrivateMessage(data.message);
});

// Message submit
chatForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Get messsage text
    const msg = e.target.elements.msg.value;

    // Emit message to server
    const [input] = [...document.getElementsByName('users')].filter(element => element.checked);
    socket.emit('chatMessage', { to_socket_id: input.id, senderUser, msg });

    // Clear input
    e.target.elements.msg.value = '';
    e.target.elements.msg.focus();
});

// --------------------------------------------------------- USER

// Get username from URL
const { username } = Qs.parse(location.search, {
    ignoreQueryPrefix: true,
});

// Emit user to server
socket.emit('new_user', username);

const renderUserCheckboxes = (element) => {
    // Create container div
    const div = document.createElement('div');

    // Create checkbox
    const checkbox = document.createElement('input');
    checkbox.type = "radio";
    checkbox.name = "users";
    checkbox.value = element.username;
    checkbox.id = element.socket_id;

    // Create checkbox label
    const label = document.createElement('label');
    label.htmlFor = element.socket_id;
    label.className = 'ml-2';
    const labelText = document.createTextNode(element.username);

    // Append created elements to div
    label.appendChild(labelText);
    div.appendChild(checkbox);
    div.appendChild(label);

    // Append created div to DOM element
    userList.appendChild(div);

    // Add listener for this user radio checkbox 
    checkbox.addEventListener('click', handleUserCheckBox);
};

const outputCurrentUser = (user) => {
    // Assign global variable for different use-cases
    senderUser = user;

    // Create and append data to DOM
    const writeName = document.createTextNode(`Hello ${user.username}`);
    const currentUser = document.getElementById('current-user');
    currentUser.appendChild(writeName);
};

const renderAllUsers = (users) => {
    // Update DOM element on any other users joining application
    document.getElementById('no-active-users').style.visibility = 'hidden';

    // Render user
    users.forEach(element => renderUserCheckboxes(element));
};

const renderNewUser = (newUser) => {
    // Update DOM elements on any other users joining application
    document.getElementById('no-active-users').style.visibility = 'hidden';
    document.getElementById('users-container').style.visibility = 'visible';

    // Render user
    renderUserCheckboxes(newUser);
};

// Listener on user inserted in DB
socket.on('user_in_db', data => {
    // Add users to DOM
    if (firstJoin) {
        // Render current user
        outputCurrentUser(data.newUser);
        if (data.users.length) {
            // Render users present in application
            renderAllUsers(data.users);
        }
        // At the end re-assign firstJoin
        firstJoin = false;
    } else {
        // Render new users sent by server
        renderNewUser(data.newUser);
    }
});

// Listener on user quitting
socket.on('user_leave', (data) => {
    // Query and hide user that left
    const child = document.getElementById(data.socket_id),
        parent = child.parentNode;
    parent.parentNode.removeChild(parent);

    if (!userList.childNodes.length) {
        // If no other users, disable users container and show 
        document.getElementById('users-container').style.visibility = 'hidden';
        document.getElementById('no-active-users').style.visibility = 'visible';
        // If no other users, disable chat button
        handleChatButton(true);
    };
});

// --------------------------------------------------------- DOM

// On page load, get current users and available games and render them
window.onload = (async () => {
    // API url and parameters
    const url = "http://localhost:4000/";
    const params = Qs.stringify({ include: { deleted: false } });

    try {
        // users API response and response parsing
        const userResult = fetch(`${url}get_users?${params}`);
        const allUsers = await (await userResult).json();

        // games API response and response parsing
        const gamesResult = fetch(`${url}get_games?${params}`);
        const allGamess = await (await gamesResult).json();

        // Show users container if any other user connected
        if (allUsers.length) {
            document.getElementById('users-container').style.visibility = 'visible';
        }

        // Render games if any games created previous to user connection
        if (allGamess.length) {
            allGamess.forEach(game => renderGame(game));
        }

        // Update game counter
        updateGamesCounter();

    } catch (error) {
        // Output fetch error in the console
        console.log(error);
    }
})();