import express from "express";
import http from 'http';
import {Server} from 'socket.io';
import {instrument} from '@socket.io/admin-ui'

const app = express();
const port = 3011;

app.set("view engine", "pug");
app.set("views", __dirname + "/views");

app.use('/public', express.static(__dirname + "/public"));
app.get('/', (req, res) => res.render("home"));
app.get('/*', (req, res) => res.redirect('/'));

const server = http.createServer(app);
const socketServer = new Server(server, {
    cors: {
      origin: ["https://admin.socket.io"],
      credentials: true
    }
  });

instrument(socketServer, {
    auth: false,
});

const publicRooms = () => {
    const {sids, rooms} = socketServer.sockets.adapter;
    const publicRoom = [];
    rooms.forEach((_, key) => {
        if(sids.get(key) === undefined) {
            publicRoom.push(key);
        }
    });
    return publicRoom;
};
// private room 을 제외한 public room 만을 반환하는 함수 작성

const countRooms = (roomName) => {
    return socketServer.sockets.adapter.rooms.get(roomName)?.size;
};
// 방의 참가중인 유저의 수를 반환하는 함수 작성

socketServer.on("connection", (socket) => {
    socket['nickname'] = 'Anonymous';
    socket.onAny((event) => {
        console.log(socketServer.sockets.adapter);
        console.log(`Socket Event : ${event}`);
    });
    // onAny()는 모든 이벤트가 발생 시 실행된다. 

    socket.on('enter_room', (roomName, done) => {
        socket.join(roomName);
        done(`inner ${roomName}`);
        socketServer.to(roomName).emit("welcome", socket.nickname, countRooms(roomName));
        // socket.to(roomName).emit("welcome", socket.nickname, countRooms(roomName));
        // to(roomname) 으로 방을 지정할 수 있으며, 뒤에 이어올 emit() method로 이벤트를 발생시킬 수 있다.
        socketServer.sockets.emit("roomChange", publicRooms());
        // 방에 입장할 때 모든 서버내 사용자에게 공지
    }); 

    socket.on('disconnecting', () => {
        socket.rooms.forEach(room => socket.to(room).emit("bye", socket.nickname, countRooms(room - 1)));
        // 접속이 끊어졌을 때 각 방에 message를 전달한다. rooms의 반환 값이 Set이기 때문에 forEach 사용이 가능하다.
    });
    // disconnecting은 disconnection과 달리 연결이 아예 끊어진 것이 아닌 접속이 끊겼음을 이야기하므로 방을 완전히 나간게 아니다.

    socket.on('disconnect', () => {
        socketServer.sockets.emit("roomChange", publicRooms());
    });
    // disconnecting 에서 변경된 room을 넘길경우 방이 사라지기 직전에 동작하기 때문에 아무도 접속하지 않은 방도 포함하기 때문에
    // 완전히 연결이 끊겼을 때 동작하는 disconnect에서 실행한다.

    socket.on('new_message', (msg, room, done) => {
        socket.to(room).emit('send_message', `${socket.nickname} : ${msg}`);
        done();
    });
    // client 에서 받아온 message를 다른 참여자에게 전달한다.

    socket.on('setNickName', nickname => {
        socket['nickname'] = nickname;
    });

});


server.listen(port, () => {
    console.log(`server on!!! http://localhost:3011/`);
    // 기존 http 서버 위에 webSocket 서버를 만들 수 있도록 listen
})

// console.log(`server on!!! http://localhost:3011/`);