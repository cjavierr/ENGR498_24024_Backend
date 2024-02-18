// app.js
const db = require("./dynamo.js");
const cors = require('cors');
const cookieParser = require("cookie-parser");

const express = require('express');
const app = express();
const port = 3001;

app.use(cookieParser());

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

// enabling CORS for all routes
app.use(cors());
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

app.get('/api/testuser',(req,res) => {
  db.createUser("javi", "password", "javier", "refugio", "javierrcota@arizona.edu");
  res.status(201).json({
    message: 'User Created successfully'
  });
});