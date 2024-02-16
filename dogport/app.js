// app.js
import db from "dynamo.js";

import express from 'express';
const app = express();
const port = 3000;

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

