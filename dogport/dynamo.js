const AWS = require("aws-sdk");

// Set up AWS credentials.
AWS.config.update({
  accessKeyId: "AKIA2Q7JBQRSY2W3JK5C",
  secretAccessKey: "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",
  region: "us-east-2",
});

// Create Instance of DynamoDB
const dynamoDB = new AWS.DynamoDB();

//Define DynamoDB document client
const docClient = new AWS.DynamoDB.DocumentClient();

const random_uuid = uuidv4();

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
 * Dashboards are in the following format
 * {
 * dashboardID : dashboardID,
 * dashboardUsers: [
 *                  {
 *                    userID: userID,
 *                    role : role
 *                  }
 *                  ],
 * dashboardKPIs: [
 *                {
 *
 *                }
 *
 *
 *                ]
 *
 *
 * }
 *
 *
 *
 *
 *
 */

/**
 * PRIVATE Creates item value in table table
 * @param {*} table
 * @param {*} value
 */
async function createItem(table, value) {
  const params = {
    TableName: table,
    Item: value,
  };
  console.log("Creating", params);

  try {
    const data = await docClient
      .put(params, (err, data) => {
        if (err) {
          console.error("Error adding item to DynamoDB", err);
        } else {
          console.log("Item added successfully", data);
        }
      })
      .promise(); // Use .promise() for chaining
  } catch (err) {
    console.error("Error putting DynamoDB table", err);
    throw err;
  }
}

/**
 * PUBLIC Creates a User in the users table from a given userName and assigns a unique userID
 * @param {String} userName
 * @param {String} firstName
 * @param {String} lastName
 * @param {String} email
 */
function createUser(userName, password, firstName, lastName, email, isAdmin, manager, department) {
  userID = uuidv4();
  console.log("Creating New User with ID " + userID);
  const item = {
    userID: userID,
    userName: userName,
    password: password,
    firstName: firstName,
    lastName: lastName,
    email: email,
    projects: [],
    dashboards: [],
    isAdmin: isAdmin,
    manager: manager,
    department: department,
  };

  createItem("users", item);
}

/**
 * Public Creates a project in table projects using a given projectName and assigns a unique projectID
 * @param {String} projectName
 * @param {Array[String]} listKPIs
 */

async function createProject(projectDetails) {
  const projectID = await generateProjectID();
  try {
    const item = {
      ...projectDetails,
      projectID: projectID,
      dashboards: [],
    };
    console.log("Creating New Project: ", item);

    await createItem("projects", item);
    const user = await getUser(projectDetails.projectOwner);
    const admin = await getUser(projectDetails.orgAdmin);

    console.log("Got user");
    console.log(user);
    await addProjectToUser(user.userID, projectID);
    await addProjectToUser(admin.userID, projectID);

    console.log("New Project Created: ", item);

    return item; // Return the created project
  } catch (error) {
    console.error("Error creating project:", error);
    throw error;
  }
}

async function deleteProject(projectId) {
  console.log("Attempting to delete project: ", projectId);
  const projectIdToRemove = projectId;
  try {
    // Step 1: Get the project details
    const projectParams = {
      TableName: "projects",
      Key: {
        projectID: projectId,
      },
    };
    console.log("Getting project: ", projectParams);
    const project = await docClient.get(projectParams).promise();
    if (!project.Item) {
      throw new Error("Project not found");
    }
    console.log("Found Project");

    // Step 3: Update each user's projects list
    const usersToUpdate = project.Item.users;
    console.log("Users: ", usersToUpdate);
    await Promise.all(
      usersToUpdate.map(async (user) => {
        const userId = user.username;
        const userData = await getUser(userId);
        if (!userData) {
          console.error(`User with username ${userId} not found`);
          return;
        }
        console.log(userData);
        const userProjects = userData.projects.filter(
          (projectId) => projectId !== projectIdToRemove
        );
        console.log("New User Params: ", userProjects);
        const userParams = {
          TableName: "users",
          Key: {
            userID: userData.userID,
          },
          UpdateExpression: "SET projects = :projects",
          ExpressionAttributeValues: {
            ":projects": userProjects,
          },
          ReturnValues: "ALL_NEW",
        };
        await docClient.update(userParams).promise();
      })
    );

    await docClient.delete(projectParams).promise();

    return { message: "Project deleted successfully" };
  } catch (error) {
    console.error("Error deleting project:", error);
    throw new Error("Failed to delete project");
  }
}

async function createDashboard(dashboardDetails) {
  try {
    console.log("Creating New Dashboard: ", dashboardDetails.dashboardName);
    const dashboardID = await generateDashboardID(dashboardDetails.project);
    const item = {
      dashid: dashboardID,
      dashboardName: dashboardDetails.dashboardName,
      ownerid: dashboardDetails.owner,
      users: dashboardDetails.users,
      project: dashboardDetails.project,
      escalate: false,
      versions: dashboardDetails.versions,
      dashboards: dashboardDetails.dashboards,
    };

    console.log(item);

    await createItem("dashboards", item);

    console.log(dashboardDetails);
    const usersToUpdate = dashboardDetails.users;

    console.log(usersToUpdate);

    for (const currentUser of usersToUpdate) {
      console.log(currentUser);
      if (!currentUser) {
        break;
      }
      const currUser = await getUser(currentUser);
      console.log(currUser);
      await addDashboardToUser(dashboardID, currUser.userID);
    }
    await addDashboardToProject(dashboardID, dashboardDetails.project);

    console.log("New Dashboard Created: ", item);

    return item; // Return the created dashboard
  } catch (error) {
    console.error("Error creating dashboard:", error);
    throw error;
  }
}

async function generateProjectID() {
  console.log("Generating Project ID");
  const projectID = "CAT-" + Math.floor(Math.random() * 99999);
  console.log("Attempting: " + projectID);
  const params = {
    TableName: "projects",
    ProjectionExpression: "projectID",
  };

  try {
    // Use the scan operation to retrieve all items from the table
    const data = await docClient.scan(params).promise();

    // Extract the project IDs from the returned items
    const projectIDs = data.Items.map((item) => item.projectID);
    console.log("Existing ProjectIDs:");
    console.log(projectIDs);
    if (projectIDs.includes(projectID)) {
      return generateProjectID();
    } else {
      return projectID;
    }
  } catch (err) {
    console.error("Error scanning DynamoDB table:", err);
    throw err; // Re-throw for error handling in the route or calling function
  }
}

async function generateDashboardID(projectid) {
  console.log("Generating Dashboard ID");
  const dashboardID =
    "DSH-" + Math.floor(Math.random() * 99999) + "-" + projectid;
  console.log("Attempting: " + dashboardID);
  const params = {
    TableName: "dashboards",
    ProjectionExpression: "dashid",
  };

  try {
    // Use the scan operation to retrieve all items from the table
    const data = await docClient.scan(params).promise();

    // Extract the project IDs from the returned items
    const dashids = data.Items.map((item) => item.dashid);
    console.log("Existing DashboardIDs:");
    console.log(dashids);
    if (dashids.includes(dashboardID)) {
      return generateProjectID();
    } else {
      return dashboardID;
    }
  } catch (err) {
    console.error("Error scanning DynamoDB table:", err);
    throw err; // Re-throw for error handling in the route or calling function
  }
}

async function getGlossary() {
  const params = {
    TableName: "glossary",
    KeyConditionExpression: "glossaryid = :glossaryid", // Change to glossaryid
    ExpressionAttributeValues: {
      ":glossaryid": "companyglossary", // Set the glossaryid value
    },
  };

  try {
    const data = await docClient.query(params).promise();
    if (data.Items.length > 0) {
      console.log(data.Items[0]);
      return data.Items[0]; // return the first item if found
    } else {
      console.log("companyglossary not found");
      return null; // return null if no item is found
    }
  } catch (err) {
    console.error("Error querying DynamoDB table", err);
  }
}

async function getOrganization() {
  const params = {
    TableName: "glossary",
    KeyConditionExpression: "glossaryid = :glossaryid", // Change to glossaryid
    ExpressionAttributeValues: {
      ":glossaryid": "organizationglossary", // Set the glossaryid value
    },
  };

  try {
    const data = await docClient.query(params).promise();
    if (data.Items.length > 0) {
      console.log(data.Items[0]);
      return data.Items[0]; // return the first item if found
    } else {
      console.log("organizationglossary not found");
      return null; // return null if no item is found
    }
  } catch (err) {
    console.error("Error querying DynamoDB table", err);
  }
}

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

async function getUserDashboards(username) {
  console.log("Compiling user dashboards for user: ", username);
  const user = await getUser(username);
  if (user) {
    const dashboardIDs = user.dashboards;
    const dashboards = [];

    for (const dashboardID of dashboardIDs) {
      const dashboard = await getDashboard(dashboardID);
      if (dashboard) {
        dashboards.push(dashboard);
      }
    }
    console.log("All Dashboards");
    console.log(dashboards);
    return dashboards; // Return the compiled list of dashboards
  } else {
    console.log("User not found");
    return null; // Return null if the user is not found
  }
}

/**
 * Finds and returns all taken UserIDs in users table
 * @returns {userIDs} - the list of User Ids
 */
async function findAllUserIds() {
  const params = {
    TableName: "users",
    ProjectionExpression: "userID",
  };

  try {
    const data = await docClient.scan(params).promise(); // Use .promise() for chaining
    const userIDs = data.Items.map((item) => item.userID);
    return userIDs;
  } catch (err) {
    console.error("Error scanning DynamoDB table", err);
    throw err; // Re-throw for error handling in the route
  }
}

/**
 * Finds and returns all taken UserNames in users table
 * @returns {userIDs} - the list of User Ids
 */
async function findAllUsernames() {
  const params = {
    TableName: "users",
    ProjectionExpression: "userName",
  };

  try {
    const data = await docClient.scan(params).promise(); // Use .promise() for chaining
    const usernames = data.Items.map((item) => item.userName);
    return usernames;
  } catch (err) {
    console.error("Error scanning DynamoDB table", err);
    throw err; // Re-throw for error handling in the route
  }
}

/**
 * Finds a user and returns their user object from user table
 * @returns {user} - User object
 */
async function getUser(userName) {
  const params = {
    TableName: "users",
    IndexName: "usernameIndex",
    KeyConditionExpression: "userName = :username",
    ExpressionAttributeValues: {
      ":username": userName,
    },
  };

  try {
    const data = await docClient.query(params).promise();
    if (data.Items.length > 0) {
      console.log(data.Items[0]);
      return data.Items[0]; // return the first user object if found
    } else {
      console.log("User not found");
      return null; // return null if no user is found
    }
  } catch (err) {
    console.error("Error scanning DynamoDB table", err);
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

async function createMilestone(projectID, milestone) {}

async function addSubcategory(projectID, subcategory) {}

async function generateMilestoneReport() {}

async function createRisk() {}

async function editMilestone() {}

async function deleteDashboard(dashboardID) {
  console.log("Attempting to delete dashboard:", dashboardID);

  try {
    // Step 1: Fetch the dashboard details

    const dashboard = await getDashboard(dashboardID);
    const dashboardParams = {
      TableName: "dashboards",
      Key: {
        dashid: dashboardID,
        ownerid: dashboard.ownerid,
      },
    };
    console.log("Dashboard found:", dashboard);

    // Step 2: Update each user's dashboard list
    const usersToUpdate = dashboard.users;
    console.log("Users to update:", usersToUpdate);

    const project = await getProject(dashboard.project);
    console.log(project);
    console.log("Dashboards: ", project.dashboards);

    const projectDashboards = project.dashboards.filter(
      (id) => id !== dashboardID
    );

    console.log("New user dashboards:", projectDashboards);

    console.log("New User Params: ", projectDashboards);
    const projectParams = {
      TableName: "projects",
      Key: {
        projectID: project.projectID,
      },
      UpdateExpression: "SET dashboards = :dashboards",
      ExpressionAttributeValues: {
        ":dashboards": projectDashboards,
      },
      ReturnValues: "ALL_NEW",
    };
    await docClient.update(projectParams).promise();

    await Promise.all(
      usersToUpdate.map(async (user) => {
        try {
          // Assuming getUser function is available and correctly implemented
          console.log();
          const userData = await getUser(user);
          if (!userData) {
            console.error(`User with ID ${user} not found`);
            return;
          }
          console.log("User data:", userData);
          const userDashboards = userData.dashboards.filter(
            (id) => id !== dashboardID
          );
          console.log("New user dashboards:", userDashboards);

          console.log("New User Params: ", userDashboards);
          const userParams = {
            TableName: "users",
            Key: {
              userID: userData.userID,
            },
            UpdateExpression: "SET dashboards = :dashboards",
            ExpressionAttributeValues: {
              ":dashboards": userDashboards,
            },
            ReturnValues: "ALL_NEW",
          };
          await docClient.update(userParams).promise();
          console.log("User dashboard list updated successfully");
        } catch (error) {
          console.error("Error updating user's dashboard list:", error);
        }
      })
    );

    // Step 4: Delete the dashboard
    console.log(dashboardParams);
    await docClient.delete(dashboardParams).promise();

    return { message: "Dashboard deleted successfully" };
  } catch (error) {
    console.error("Error deleting dashboard:", error);
    throw new Error("Failed to delete dashboard");
  }
}

async function editDashboard() {}

async function editRisk() {}

async function createIssue() {}

async function getDashboard(dashboardID) {
  console.log("Retrieving dashboard: ", dashboardID);

  try {
    const params = {
      TableName: "dashboards", // Replace with your actual table name
      KeyConditionExpression: "dashid = :dashboardID",
      ExpressionAttributeValues: {
        ":dashboardID": dashboardID,
      },
    };

    try {
      const data = await docClient.query(params).promise();
      if (data.Items.length > 0) {
        console.log(data.Items[0]);
        return data.Items[0]; // return the first user object if found
      } else {
        console.log("User not found");
        return null; // return null if no user is found
      }
    } catch (err) {
      console.error("Error scanning DynamoDB table", err);
    }
  } catch (err) {
    console.error("Error querying DynamoDB table:", err);
    throw err; // Rethrow the error to be handled by the caller
  }
}

async function addProjectToUser(userId, projectId) {
  try {
    const params = {
      TableName: "users", // Replace with your actual table name
      Key: {
        userID: userId,
      },
      UpdateExpression: `SET projects = list_append(if_not_exists(projects, :emptyList), :projectID)`,
      ExpressionAttributeValues: {
        ":emptyList": [],
        ":projectID": [projectId], // Assuming projectId is a string
      },
      ReturnValues: "ALL_NEW", // Return updated item
    };

    const data = await docClient.update(params).promise();
    console.log("Updated user data:", data.Attributes); // Log updated user data
    return { message: "Project added successfully", user: data.Attributes }; // Return success message and updated user data
  } catch (error) {
    console.error("Error updating user projects:", error);
    return { message: "Error adding project" }; // Handle error gracefully
  }
}

async function addDashboardToProject(dashid, projectid) {
  console.log("Adding Dashboard to project");
  try {
    const params = {
      TableName: "projects", // Replace with your actual table name
      Key: {
        projectID: projectid,
      },
      UpdateExpression: `SET dashboards = list_append(if_not_exists(dashboards, :emptyList), :dashid)`,
      ExpressionAttributeValues: {
        ":emptyList": [],
        ":dashid": [dashid], // Assuming projectId is a string
      },
      ReturnValues: "ALL_NEW", // Return updated item
    };

    const data = await docClient.update(params).promise();
    console.log("Updated projects dashboards:", data.Attributes); // Log updated user data
    return { message: "Dashboard added successfully", user: data.Attributes }; // Return success message and updated user data
  } catch (error) {
    console.error("Error updating project dashboards:", error);
    return { message: "Error adding dashboard" }; // Handle error gracefully
  }
}

async function addDashboardToUser(dashid, userId) {
  console.log("Adding Dashboard to User");
  console.log(dashid + " : " + userId);
  try {
    const params = {
      TableName: "users", // Replace with your actual table name
      Key: {
        userID: userId,
      },
      UpdateExpression: `SET dashboards = list_append(if_not_exists(dashboards, :emptyList), :dashid)`,
      ExpressionAttributeValues: {
        ":emptyList": [],
        ":dashid": [dashid], // Assuming projectId is a string
      },
      ReturnValues: "ALL_NEW", // Return updated item
    };

    const data = await docClient.update(params).promise();
    console.log("Updated user dashboards:", data.Attributes); // Log updated user data
    return { message: "Dashboard added successfully", user: data.Attributes }; // Return success message and updated user data
  } catch (error) {
    console.error("Error updating user projects:", error);
    return { message: "Error adding project" }; // Handle error gracefully
  }
}

async function addUserToProject(userId, projectId, role) {
  try {
    const params = {
      TableName: "projects",
      Key: {
        projectID: projectId, // Corrected from 'userID' to 'projectID'
      },
      UpdateExpression:
        "SET #users = list_append(if_not_exists(#users, :emptyList), :user)",
      ExpressionAttributeNames: {
        "#users": "users",
      },
      ExpressionAttributeValues: {
        ":emptyList": [],
        ":user": [{ userId, role }],
      },
      ReturnValues: "ALL_NEW",
    };

    const data = await docClient.update(params).promise();
    console.log("Updated project data:", data.Attributes);
    return { message: "User added successfully", user: data.Attributes };
  } catch (error) {
    console.error("Error updating project users:", error);
    throw error;
  }
}

/**
 * Finds and returns all taken ProjectIDs in the projects table
 * @returns {Array[String]} - the list of Project Ids
 */
function findAllProjectIDs() {
  console.log("finding all project IDs");
  const params = {
    TableName: "projects",
    ProjectExpression: "projectID",
  };

  docClient.scan(params, (err, data) => {
    if (err) {
      console.error("Error scanning DynamoDB table", err);
    } else {
      console.log("data");
      console.log(data.Items);
      const projectIDs = data.Items.map((item) => item.projectIDs);
      return projectIDs;
    }
  });
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function findMyProjects(myUserID) {
  const params = {
    TableName: "users",
    Key: {
      userID: { S: myUserID },
    },
  };

  dynamoDB.get(params, (err, data) => {
    if (err) {
      console.error("Error reading item from DynamoDB:", err);
      return err;
    } else {
      return data.Item.projects;
    }
  });
}

async function updateDashboard(dashboardDetails) {
  try {
    const params = {
      TableName: "dashboards",
      Key: {
        dashid: dashboardDetails.dashid,
        ownerid: dashboardDetails.ownerid,
      },
      Item: {
        dashid: dashboardDetails.dashid,
        dashboardName: dashboardDetails.dashboardName,
        ownerid: dashboardDetails.ownerid,
        users: dashboardDetails.users,
        project: dashboardDetails.project,
        escalate: dashboardDetails.dashid,
        versions: dashboardDetails.versions,
        dashboards: dashboardDetails.dashboards,
      },
    };
    console.log("Updating dashboard with parameters:", params);

    const data = await docClient.put(params).promise();
    console.log("Dashboard updated successfully:", data);

    return data;
  } catch (error) {
    console.error("Error updating dashboard:", error);
    throw error;
  }
}

async function updateProject(projectData) {
  console.log(projectData);
  try {
    const params = {
      TableName: "projects", // Replace with your actual table name
      Key: {
        projectID: projectData.projectId, // Assuming projectID is the primary key
      },
      UpdateExpression:
        "SET #name = :name, #description = :description, #owner = :owner, #notes = :notes, #subcategories = :subcategories, #kpi = :kpi, #users = :users",
      ExpressionAttributeNames: {
        "#name": "projectName",
        "#description": "projectDescription",
        "#owner": "projectOwner",
        "#notes": "projectNotes",
        "#subcategories": "subcategories",
        "#kpi": "KPIs",
        "#users": "users",
      },
      ExpressionAttributeValues: {
        ":name": projectData.projectName,
        ":description": projectData.projectDescription,
        ":owner": projectData.projectOwner,
        ":notes": projectData.projectNotes,
        ":subcategories": projectData.subcategories,
        ":kpi": projectData.KPIs,
        ":users": projectData.users,
      },
      ReturnValues: "ALL_NEW", // Return all attributes of the updated item
    };

    // Update the project in the DynamoDB table
    const data = await docClient.update(params).promise();
    return data.Attributes; // Return the updated project data
  } catch (err) {
    throw err; // Throw the error to be caught by the calling function
  }
}

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

function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

module.exports = {
  createUser,
  createProject,
  findAllUserIds,
  findAllUsernames,
  findAllProjectIDs,
  getRandomInt,
  getUser,
  addProjectToUser,
  addDashboardToUser,
  getProject,
  addUserToProject,
  createDashboard,
  getDashboard,
  updateDashboard,
  updateProject,
  getUserProjects,
  deleteProject,
  getUserDashboards,
  deleteDashboard,
  getGlossary,
  getOrganization
};
