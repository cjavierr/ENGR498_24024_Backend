// app.js
const express = require('express');
const app = express();
const port = 3000;
const AWS = require('aws-sdk');

// Set up AWS credentials. 
AWS.config.update({
  accessKeyId: 'AKIA2Q7JBQRSY2W3JK5C',
  secretAccessKey: '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',
  region: 'us-east-2',
});

// Create Instance of DynamoDB
const dynamoDB = new AWS.DynamoDB();

//Define DynamoDB document client
const docClient = new AWS.DynamoDB.DocumentClient();

/*
createItem(){
  this function takes in a String table and JSON value where value looks like:

  {userID: "userID",
   ... : ... }

  And adds value as an item to the table if table exists.
}

*/
function createItem (table, value){
  const params = {
    TableName: table,
    Item: value
  };
  
  docClient.put(params, (err, data) => {
    if(err){
      console.error('Error adding item to DynamoDB', err);
    } else {
      console.log('Item added successfully', data)
    }
  });
}

// function readItem(){
//   const params = {
//     Key: {
//       key: 'value'
//     }
//   }
//   docClient.get(params, (err, data) => {
//     if(err) {
//       console.error('Error reading item from DynamoDB', err);
//     } else {
//       console.log('Item retrieved successfully', data.Item);
//     }
//   });
// };

// function updateItem(){
//   const params = {
//     Key: {
//       key: 'value'
//     },  
//     UpdateExpression: 'set attribute1 = :value1, attribute2 = :=value2',
//     ExpressionAttributeValues:{
//       ':value1': 'new-value1',
//       ':value2': 'new-value2'
//     }
//   }

//   docClient.update(params, (err,data) => {
//     if(err){
//       console.error('Error updating item in DynamoDB', err);
//     } else {
//       console.log('Item updated successfully', data);
//     }
//   });
// }


// function deleteItem(table, key){
//   const params = {
//     TableName: table,
//     Key: {
//       key: key
//     }
//   }

//   docClient.delete(params, (err, data) => {
//     if(err){
//       console.error
//     }
//   })
// }



// Define a route
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is listening at http://localhost:${port}`);
});

app.get('/test', (req, res) => {
  res.send('Breh');
  createItem("users", {
    userID: "42069",
    userName: "Jerry"
  });
});