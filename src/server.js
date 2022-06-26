import express from "express";
import http from 'http';
import WebSocket from "ws";

const app = express();
const port = 3011;

app.set("view engine", "pug");
app.set("views", __dirname + "/views");

app.use('/public', express.static(__dirname + "/public"));
app.get('/', (req, res) => res.render("home"));
app.get('/*', (req, res) => res.redirect('/'));

const server = http.createServer(app);
const wss = new WebSocket.Server({server});
// webSocket은 브라우저와 서버사이의 연결이다.
// server, wss 가 같은 port 안에서 동작하길 원하기 때문에 위처럼 작성하지만 필수적인 요소는 아니다.
// 둘 중 하나만 특히 ws 만 실행시키고 싶은 경우 http 서버를 따로 만들어줄 이유는 없다.
// http 서버로 페이지를 표출하고 ws 서버를 같은 port에서 처리할 수 있도록 지정

const sockets = [];
// client 간 message 전송을 위해 임시로 만든 db

wss.on("connection", (socket) => {
    sockets.push(socket);
    socket['nickname'] = 'Anonymous';
    socket.on("close", () => console.log("Disconnected Browser"));
    // 브라우저 탭을 닫아 연결이 끊길 시 이벤트 발생

    socket.on('message', (msg) => {
        const jsonMessage = JSON.parse(msg);
        switch(jsonMessage.type) {
            case "newMessage":
                sockets.forEach(v => v.send(`${socket.nickname} : ${jsonMessage.payload}`));
            case "nickname":
                socket["nickname"] = jsonMessage.payload;
                // socket 데이터 또한 객체이기 때문에 위 처럼 값을 넣을 수 있다.
        }
        // 임시 db에 저장된 client 전체에 message 전송
    });
    // 현재 webSocket은 각각의 브라우저에 대해 개별적으로 작동하고 있어 브라우저간 message를 주고받지 못한다.
});
// 현재 js 파일인 server의 socket은 연결된 브라우저를 뜻하며 client에 존재하는 socket은 서버로의 연결을 뜻한다.
// webSocket은 event를 사용하여 각각의 동작을 지정할 수 있다.
// on() method는 이벤트가 발생하길 기다리며 위의 경우 connection이 이뤄졌을 경우 작동한다.
// on() method는 backend에 연결된 사람의 정보를 제공하며 콜백에서 받은 socket에 지정된다.
// connection 이벤트가 없어도 클라이언트와 실제 연결은 되기 때문에 다른 동작이 없다면 필수는 아니다.

server.listen(port, () => {
    console.log(`server on!!! http://localhost:3011/`);
    // 기존 http 서버 위에 webSocket 서버를 만들 수 있도록 listen
})

// console.log(`server on!!! http://localhost:3011/`);