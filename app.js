const dotenv =require("dotenv");
dotenv.config(); //function calling config()
const express =require("express");
const cors =require("cors");
const connectDB =require("./config/mongodb.js");  
const userRoutes =require("./routes/userRoutes.js");
const sendEmail = require('./config/sendMail');
const formModel = require('./models/Form');
const socket = require("socket.io");

const app = express();
const server = require("http").Server(app);

const io = socket(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});
const { v4: uuidv4 } = require("uuid");
const { ExpressPeerServer } = require("peer");
const opinions = {
  debug: true,
}

app.set("view engine", "ejs");

const port = process.env.PORT;
const DATABASE_URL = process.env.MONGODB_URI;

//establishing MongoDB Connection
connectDB(DATABASE_URL);
console.log("proceeded");

app.use("/peerjs", ExpressPeerServer(server, {
  debug: true,
}));

//CORS POLICY - used to encounter any errors detected while connecting to our Frontend
app.use(cors());

//JSON
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static("public"));

//Load Routes
app.use("/api/user", userRoutes); //calls api/user/register

app.get("/videocall", (req, res) => {
  res.redirect(`/${uuidv4()}`);
});

app.get("/videocall/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

app.post('/api/email', (req, res) => {
  const { name, subject, emailFrom, emailTo, text } = req.body;
  console.log('Data: ', req.body);

  const formDetail = new formModel({
    name: name,
    sendFrom: emailFrom,
    sendTo: emailTo,
    text: text
  }) 
  formDetail.save();

  sendEmail(name, emailFrom, emailTo, subject, text, function(err, data) {
    if (err) {
        res.status(500).send("error: " + err);
        console.log(err);
    } else {
        res.send({ message: 'Email sent!!!' });
        console.log("success");
    }
  });
  // res.json({ message: 'received!' })
});


server.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

// Setting up socket.io connection
global.onlineUsers = new Map();
io.on("connection", (socket) => {
  global.chatSocket = socket;
  socket.on("add-user", (userId) => {
    onlineUsers.set(userId, socket.id);
  });

  socket.on("send-msg", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("msg-recieve", data.msg);
    }
  });

  socket.on("join-room", (roomId, userId, userName) => {
    socket.join(roomId);
    setTimeout(()=>{
      socket.to(roomId).broadcast.emit("user-connected", userId);
    }, 1000)
    socket.on("message", (message) => {
      io.to(roomId).emit("createMessage", message, userName);
    });
  });
});
