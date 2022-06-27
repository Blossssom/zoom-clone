const socket = io();
// /socket.io/socket.io.js 에 작성되어있는 io method를 사용해 server와 연결

const roomDiv = document.getElementById('rooms');
const form = roomDiv.querySelector('form');
const sectionRoom = document.getElementById('room');


sectionRoom.hidden = true;
roomDiv.hidden = false;

let roomName;

const showRoom = (msg) => {
    console.log(`Server send : ${msg}`);
    roomDiv.hidden = true;
    sectionRoom.hidden = false;
    const roomTitle = sectionRoom.querySelector('h3');
    const messageForm = sectionRoom.querySelector('#messageForm');
    const nicknameForm = sectionRoom.querySelector('#nickNameForm');
    roomTitle.textContent = roomName;
    messageForm.addEventListener('submit', handleMessageSubmit);
    nicknameForm.addEventListener('submit', handleNickNameSubmit);
};

const handleNickNameSubmit = (e) => {
    e.preventDefault();
    const input = sectionRoom.querySelector('#nickNameForm input');
    socket.emit('setNickName', input.value);
};

const addMessage = (msg) => {
    const ul = sectionRoom.querySelector('ul');
    const li = document.createElement('li');
    li.textContent = msg;
    ul.append(li);
};


const handleRoomSubmit = (e) => {
    e.preventDefault();
    const input = form.querySelector('input');    
    socket.emit('enter_room', input.value, showRoom);
    // 기존의 send 대신 emit을 사용해 이벤트를 생성하면 어떠한 event도 전송이 가능하며 string 외에 다른 타입도 전송이 가능하다.
    // stringipy 등 별도의 단계 없이 socket이 자동으로 처리해주기 때문에 이 과정으로도 충분하다.
    // emit(eventName, data ... , function())의 형식으로 작성이 가능하며, function은 서버에서 호출할 수 있다. (실행은 물론 client에서 실행한다.)
    roomName = input.value;
    input.value = '';
};

const handleMessageSubmit = (e) => {
    e.preventDefault();
    const input = sectionRoom.querySelector('#messageForm input');
    let message = input.value;
    // 버튼 클릭 후 input.value를 비워주게 되면 emit 내부의 함수 실행 시 input.value가 비워지기 때문에 값을 저장한 후 전달한다.
    socket.emit('new_message', input.value, roomName, () => {
        addMessage(`You : ${message}`)
    });
    // message 전송 시 이벤트 호출
    input.value = '';
};


form.addEventListener('submit', handleRoomSubmit);

socket.on("welcome", (nickname, newCount) => {
    const roomTitle = sectionRoom.querySelector('h3');
    roomTitle.textContent = `${roomName} (${newCount})`;
    addMessage(`${nickname} joined !!!`);
});
// 서버에서 생성한 welcome 이벤트를 클라이언트에서 실행한다.
// 이전 WebSocket 예제와 달리 자기 자신 즉, 해당 socket을 제외한 지정 방의 참여자에게 message를 전달하기 때문에 이벤트를 발생시킨 socket에서는 보이지 않는다.

socket.on("bye", (nickname, newCount) => {
    const roomTitle = sectionRoom.querySelector('h3');
    roomTitle.textContent = `${roomName} (${newCount})`;
    addMessage(`${nickname} left...`);
});

socket.on("send_message", addMessage);
// 다른 참여자가 보낸 message를 받아온다.
// socket.on("send_message", (msg) => addMessage(msg)); 와 동일하게 동작한다.

socket.on('roomChange', (rooms) => {
    const roomList = roomDiv.querySelector('ul');
    if(!rooms.length) {
        roomList.innerHTML = "";
    }
    // 방이 사라질 때 마다 서버로 부터 리스트를 반환 받기 때문에 리스트가 비어있을 경우 roomList를 비워준다.
    rooms.forEach((room) => {
        const li = document.createElement('li');
        li.textContent = room;
        roomList.append(li);
    })
});

// 현재 열린 방을 표출하기 위해 내부 element를 생성하며 추가한다.