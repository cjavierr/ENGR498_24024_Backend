// app.js
const db = require("./dynamo.js");
const cors = require('cors');
const cookieParser = require("cookie-parser");
const bodyParser = require('body-parser');
const jwt = require("jsonwebtoken");
const express = require('express');
const app = express();
const port = 3001;

// enabling CORS for all routes
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(cookieParser());

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

/**
 * Starts server and listens on port port
 */
app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});

/**
 * Api call to create a new user
 */
app.post('/api/newuser', (req, res) => {
  db.createUser(req.body.userName, req.body.password, req.body.firstName, req.body.lastName, req.body.email);
  res.status(201).json({
    message: 'User Created successfully'
  });
});

/**
 * 
 */
app.post('/api/createNewProject', (req, res) => {
  const jwtInfo = jwt.verify(req.cookies.token, "ibby");
  const userID = jwtInfo.userID;
  console.log(req.body, userID)
  db.createProject(req.body.projectName, userID, req.body.listKPIs, req.body.projectDescription);
});

/**
 * 
 */
app.post('/api/addUserToProject', (req, res) => {

});

/*
 * Get functions read data from table and pass it to user
 */

/**
 * 
 */
app.get('/api/readUserProjects', (req, res) => {

});

app.post("/api/login", async (req, res) => {
  const userName = req.body.userName;
  const password = req.body.password;
  console.log(userName, password, req.body);

  const user = await db.getUser(userName);

  if (!user || user.password !== password) {
    return res.status(403).json({
      error: "invalid login",
    });
  }

  delete user.password;

  const token = jwt.sign(user, "ibby", { expiresIn: "1h" });

  res.cookie("token", token, {maxAge: 60 * 60 * 1000});

  res.status(200).json();
});