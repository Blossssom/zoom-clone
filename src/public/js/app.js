const messageList = document.querySelector('ul');
const messageForm = document.querySelector('#messageForm');
const nickNameForm = document.querySelector('#nickNameForm');
const socket = new WebSocket(`ws://${window.location.host}`);
// client와 webSokect 연결을 위해 http 프로토콜이 아닌 ws 프로토콜로 url 지정

socket.addEventListener('open', () => {
    // 서버 socket의 connection 이벤트가 발생하고 클라이언트에서 받아 들였을 때 해당 이벤트 발생
    console.log('Connect!!!');
});

socket.addEventListener('message', (message) => {
    // 서버 socket으로부터 message(data, target ...)를 send 받을 때 마다 이벤트 발생
    console.log(`New Message : ${message.data}`);
    const li = document.createElement('li');
    li.innerText = message.data;
    messageList.append(li);
});

socket.addEventListener('close', () => {
    // 서버와 연결이 끊어졌을 때 이벤트 발생
    console.log('Disconnect!!!');
});

const makeMessageType = (type, payload) => {
    const msg = {type, payload};
    return JSON.stringify(msg);
};
// nickname과 message 구별을 위해 json 형태로 전달

const handleSubmit = (e) => {
    e.preventDefault();
    const input = messageForm.querySelector('input');
    socket.send(makeMessageType('newMessage', input.value));
    input.value = '';
};

const handleNickNameSubmit = (e) => {
    e.preventDefault();
    const input = nickNameForm.querySelector('input');
    socket.send(makeMessageType('nickname', input.value));
};

messageForm.addEventListener('submit', handleSubmit);
nickNameForm.addEventListener('submit', handleNickNameSubmit);