const socket = io();

//Elements
const $messageForm = document.querySelector('#form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('button');

const $locationButton = document.querySelector('#send-location');

const $messages = document.querySelector('#messages');

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-template').innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

//Options
const {username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

const autoScroll = () => {
    // New message element
    const $newMessages = $messages.lastElementChild;

    // Height of the last message
    const newMessageStyles = getComputedStyle($newMessages);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = $newMessages.offsetHeight + newMessageMargin;

    // Visible height
    const visibleHeight = $messages.offsetHeight;

    //Height of mssages container
    const containerHeight = $messages.scrollHeight;

    // Height of message container
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight;
    }
};

socket.on('message', (message) => {
    console.log(message);

    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a'),
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoScroll()
});

socket.on('locationMessage', (message) => {
    console.log(message);

    const html = Mustache.render(locationTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a'),
    });
    $messages.insertAdjacentHTML('beforeend', html);
    autoScroll();

});

socket.on('roomData', ({room, users}) => {

    const  html = Mustache.render(sidebarTemplate, {
        room,
        users
    });

    document.querySelector('#sidebar').innerHTML = html;
});

$messageForm.addEventListener('submit', (c) => {
    event.preventDefault();

    $messageFormButton.setAttribute('disabled', 'disabled');

    const message = event.target.elements[0].value;

    socket.emit('sendMessage', message, (message) => {
        $messageFormButton.removeAttribute('disabled');
        $messageFormInput.value = '';
        $messageFormInput.focus();

        console.log('The message was delivered', message);
    });
});

document.querySelector('#send-location').addEventListener('click', () => {
   if (!navigator.geolocation) {
       return alert('Geolocation is not supported');
   }

    $locationButton.setAttribute('disabled', 'disabled');

   navigator.geolocation.getCurrentPosition((position) => {
       const coords = position.coords;
       socket.emit('sendLocation', {
           lat: coords.latitude,
           long: coords.longitude,
       }, (message) => {
           console.log(message);
           $locationButton.removeAttribute('disabled');
       });
   })
});

socket.emit('join', { username, room }, (error) => {
    if (error) {
       alert(error);
       location.href = '/';
    }
});