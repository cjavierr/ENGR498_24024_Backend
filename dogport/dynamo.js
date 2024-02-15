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
 * Users are the following format
 * {
 * userID: userID,
 * userName : userName,
 * password : password,
 * firstName : firstName
 * lastName : lastName,
 * email : email,
 * projects : [
 *              projectID,
 *              projectID
 *            ]
 * }
 */

/*
 * Projects are in the following format
 * {
 * projectID : projectID,
 * projectUsers : [
 *                  {
 *                    userID: userID,
 *                    role : role
 *                  },
 *                  {
 *                    userID: userID,
 *                    role : role
 *                  }
 *                ],
 * kpis : [
 *          {
 *            title : "budget",
 *            budget : 100100100,
 *            misc : misc
 *          },
 *          {
 *            title : "schedule",
 *            deadline :  date,
 *            misc : misc
 *            misc2 : misc2
 *          }
 *        ]
 * }
 * 
 * 
 */



/**
 * PRIVATE Creates item value in table table
 * @param {*} table 
 * @param {*} value 
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

/**
 * PUBLIC Creates a User in the users table from a given userName and assigns a unique userID
 * @param {String} userName 
 * @param {String} firstName 
 * @param {String} lastName 
 * @param {String} email 
 */
function createUser(userName, password, firstName, lastName, email){


  userIDs = findAllUserIds();
  userID = getRandomInt(1,99999)
  while (userIDs.includes(userID) == true) {
    userID = getRandomInt(1,99999)
  }

  const item = {
    userID : userID,
    userName : userName,
    password : password,
    firstName : firstName,
    lastName : lastName,
    email : email,
    projects : []
  }

  createItem("users", item)
}

/**
 * Public Creates a project in table projects using a given projectName and assigns a unique projectID
 * @param {String} projectName 
 * @param {Array[String]} listKPIs 
 */

function createProject(projectName, listKPIs){
  projectIDs = findAllProjectIDs();
  projectID = getRandomInt(1,99999)
  while (projectIDs.includes(projectID) == true){
    projectID = getRandomInt(1,99999)
  }

  const item = {
    projectID : projectID,
    projectName : projectName,
    kpis : []
  }
}


/**
 * Finds and returns all taken UserIDs in users table
 * @returns {userIDs} - the list of User Ids
 */
function findAllUserIds(){

  const params = {
    TableName: 'users',
    ProjectExpression: 'userID'
  }

  docClient.scan(params, (err, data) => {
    if(err){
      console.error('Error scanning DynamoDB table', err);
    } else {
      const userIDs = data.Items.map(item => item.userID);
    }
    return userIDs
  });
}

/**
 * Finds and returns all taken ProjectIDs in the projects table
 * @returns {Array[String]} - the list of Project Ids
 */
function findAllProjectIDs(){

  const params = {
    TableName: 'projects',
    ProjectExpression : 'projectID'
  }

  docClient.scan(params, (err, data) => {
    if(err){
      console.error('Error scanning DynamoDB table', err);
    } else {
      const projectIDs = data.Items.map(item => item.projectIDs);
    }
    return projectIDs
  });
}


function getRandomInt(min, max){
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  function findMyProjects(myUserID){
    const params = {
      TableName: "users",
      Key: {
        userID: {S: myUserID}
      }
    };
  
    dynamoDB.get(params, (err, data) => {
      if(err) {
        console.error('Error reading item from DynamoDB:', err);
        return err;
      } else {
        return(data.Item.projects);
      }
    });
  };
  
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