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
async function createItem (table, value){
  const params = {
    TableName: table,
    Item: value
  };
  
  try {
    const data = await docClient.put(params).promise();
    console.log('Item added successfully', data);
  } catch (err) {
    console.error('Error adding item to DynamoDB', err);
  }
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
  userID = userID.toString()
  
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

function createProject(projectName, ownerID, listKPIs, projectDescription){
  projectIDs = findAllProjectIDs();
  projectID = getRandomInt(1,999);
  projectID = "CAT-" + projectID.toString();  
  // while (projectIDs.includes(projectID) == true){
  //   projectID = getRandomInt(1,99999)
  // }
  const projectUsers = [{userID: ownerID, role: "owner"}]
  const item = {
    projectID : projectID,
    projectName : projectName,
    projectUsers : projectUsers,
    kpis : listKPIs,
    projectDescription : projectDescription
  }
  console.log(item)
  createItem("projects", item)
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
      console.log(userIDs);
    }
    return userIDs
  });
}

/**
 * Finds a user and returns their user object from user table
 * @returns {user} - User object
 */
async function getUser(userName) {
  const params = {
    TableName: 'users',
    IndexName: 'usernameIndex',
    KeyConditionExpression: 'userName = :username',
    ExpressionAttributeValues: {
      ':username': userName
    }
  };

  try {
    const data = await docClient.query(params).promise();
    if (data.Items.length > 0) {
      return data.Items[0]; // return the first user object if found
    } else {
      console.log('User not found');
      return null; // return null if no user is found
    }
  } catch (err) {
    console.error('Error scanning DynamoDB table', err);
  }
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

  async function getUserProjects(userName) {
    console.log("Compiling user projects for user: ", userName);
    const user = await getUser(userName);
    if (user) {
      const projectIDs = user.projects;
      const projects = [];
  
      for (const projectID of projectIDs) {
        const project = await getProject(projectID);
        if (project) {
          projects.push(project);
        }
      }
      console.log("All Projects");
      console.log(projects);
      return projects; // Return the compiled list of projects
    } else {
      console.log("User not found");
      return null; // Return null if the user is not found
    }
  }

  async function getProject(projectID) {
    try {
      const params = {
        TableName: "projects", // Replace with your actual table name
        KeyConditionExpression: "projectID = :projectID",
        ExpressionAttributeValues: {
          ":projectID": projectID,
        },
      };
  
      const data = await docClient.query(params).promise();
      if (data.Items.length > 0) {
        console.log(data.Items[0]);
        return data.Items[0]; // Return the project object if found
      } else {
        console.log("Project not found");
        return null; // Return null if no project is found
      }
    } catch (err) {
      console.error("Error querying DynamoDB table", err);
    }
  }

  /**
   * Finds a project by its projectID and modifies it
   * @param {String} projectID 
   * @param {Object} updateValues - An object containing the keys and values to be updated
   */
  async function updateProject(projectID, updateValues) {
    const params = {
      TableName: 'projects',
      Key: {
        'projectID': projectID
      },
      ExpressionAttributeNames: {},
      ExpressionAttributeValues: {},
      UpdateExpression: 'SET',
    };

    let prefix = '';
    const attributes = Object.keys(updateValues);
    for (let i = 0; i < attributes.length; i++) {
      params.UpdateExpression += prefix + '#' + attributes[i] + ' = :' + attributes[i];
      params.ExpressionAttributeNames['#' + attributes[i]] = attributes[i];
      params.ExpressionAttributeValues[':' + attributes[i]] = updateValues[attributes[i]];
      prefix = ', ';
    }

    try {
      const data = await docClient.update(params).promise();
      console.log('Project updated successfully', data);
    } catch (err) {
      console.error('Error updating project in DynamoDB', err);
    }
  }

  module.exports.updateProject = updateProject;
/**
 * Public Creates a dashboard in dashboards using given dashboardname, projectID
 * ColumnNamnes, rowNames and values
 * @param {String} dashboardName 
 * @param {String} projectID 
 * @param {String} ownerid 
 * @param {String} category  
 * @param {Array[String]} columnNames
 * @param {Array[String]} rowNames
 * @param {Array[Array[Number]]} values
 0
 */

async function createDashboard(dashboardName, projectID, ownerid, category, columnNames, rowNames, values){
  dashid = getRandomInt(1,99999).toString();
  dashid = "CAT-" + dashid;

  const item = {
    dashid : dashid,
    dashboardName : dashboardName,
    projectID : projectID,
    ownerid : ownerid,
    category : category,
    columnNames : columnNames,
    rowNames : rowNames,
    values : values
  }

  createItem("dashboards", item)
  updateProject(projectID, {dashboards: dashid})
  }


async function getProjectRisks(projectID) {
  const params = {
    TableName: 'projects',
    Key: {
      'projectID': projectID
    }
  };

  try {
    const data = await docClient.get(params).promise();
    const project = data.Item;

    if (project) {
      // Assuming the risks are stored in a "risks" field in the project object
      return project.risks;
    } else {
      console.error(`Project with ID ${projectID} not found`);
      return null;
    }
  } catch (error) {
    console.error(`Error getting project with ID ${projectID}`, error);
    return null;
  }

}

async function addRisks(projectID, riskObject) {
  const params = {
    TableName: 'projects',
    Key: {
      'projectID': projectID
    }
  };

  try {
    const data = await docClient.get(params).promise();
    const project = data.Item;

    if (project) {
      // Assuming the risks are stored in a "risks" field in the project object
      project.risks = [...project.risks, riskObject];

      const updateParams = {
        TableName: 'projects',
        Key: {
          'projectID': projectID
        },
        UpdateExpression: 'set risks = :r',
        ExpressionAttributeValues: {
          ':r': project.risks
        },
        ReturnValues: 'UPDATED_NEW'
      };

      const updateResult = await docClient.update(updateParams).promise();
      return updateResult.Attributes.risks;
    } else {
      console.error(`Project with ID ${projectID} not found`);
      return null;
    }
  } catch (error) {
    console.error(`Error updating project with ID ${projectID}`, error);
    return null;
  }

}

/**
 * Finds the project associated to a risk by the risk's riskID, 
 * changes the owner of that specific risk to be the orgAdmin from the orgAdmin section of the project, 
 * and changes the current owner of that risk to instead be appended to that risk's viewer list.
 * @param {String} riskID 
 * @param {String} orgAdmin 
 */
async function escalateRisk(riskID) {
  // Extract projectID from riskID
  const projectID = riskID.split('-').slice(0, 2).join('-');
  // Get the project
  try{
  const project = await getProject(projectID);

  // Find the risk within the project
  const riskToUpdate = project.risks.find(risk => risk.recordNumber === riskID);
  // If risk is not found, throw an error
  if (!riskToUpdate) {
    throw new Error(`Risk with record number ${riskID} not found in project ${projectID}`);
  }
  
  const originalOwner = riskToUpdate.owner;
  // Append the current owner to the viewer list
  riskToUpdate.viewers.push(riskToUpdate.owner);

  // Change the owner to the orgAdmin
  riskToUpdate.owner = project.orgAdmin;

  riskToUpdate.notes += ` Escalated by ${originalOwner} to ${riskToUpdate.owner}.`;

  // Update the risk in the project
  const updatedRisks = project.risks.map(risk => risk.recordNumber === riskID ? riskToUpdate : risk);

  // Update the project in the database
  await updateProject(projectID, { risks: updatedRisks });
} catch (err) {
  console.error(`Error escalating risk for project ${projectID}`, err);
}
}

/**
 * Edits a risk within a project with a specific riskID parameter, and a risk object to replace it with
 * @param {String} projectID 
 * @param {String} riskID 
 * @param {Object} riskObject 
 */
async function editRisk( riskID, riskObject) {
  const projectID = riskID.split('-').slice(0, 2).join('-');
  const project = await getProject(projectID);
  const risks = project.risks;

  // Find the risk with the given recordNumber and replace it with the new riskObject
  for (let i = 0; i < risks.length; i++) {
    if (risks[i].recordNumber === riskID) {
      risks[i] = riskObject;
      break;
    }
  }

  const params = {
    TableName: 'projects', // replace with your table name
    Key: {
      'projectID': projectID
    },
    UpdateExpression: 'set risks = :risks',
    ExpressionAttributeValues: {
      ':risks': risks
    },
    ReturnValues: 'UPDATED_NEW'
  };

  try {
    const data = await docClient.update(params).promise();
    console.log('Risk updated successfully', data);
  } catch (err) {
    console.error('Error updating risk in DynamoDB', err);
  }
}

module.exports.editRisk = editRisk;

 
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
  module.exports = {
    createUser,
    createProject,
    findAllUserIds,
    findAllProjectIDs,
    getRandomInt,
    getUser,
    createDashboard,
    addRisks,
    getProjectRisks,
    getUserProjects,
    getUser,
    escalateRisk,
    editRisk,
  };