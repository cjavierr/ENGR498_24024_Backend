// app.js
const db = require("./dynamo.js");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const express = require("express");
const app = express();
const port = 3001;

// enabling CORS for all routes
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(cookieParser());

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("Hello, World!");
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
app.post("/api/newuser", (req, res) => {
  db.createUser(
    req.body.userName,
    req.body.password,
    req.body.firstName,
    req.body.lastName,
    req.body.email,
    req.body.isAdmin
  );
  res.status(201).json({
    message: "User Created successfully",
  });
});

/**
 *
 */
app.post("/api/createNewProject", async (req, res) => {
  console.log("Creating New Project");
  console.log(req.body);

  try {
    // Call your database function to create the project
    const project = await db.createProject(req.body);
    db.addProjectToUser(req.body.userID, project.projectID);
    res.status(201).json({
      message: "Project Created successfully",
    });
  } catch (error) {
    console.error("Error creating project:", error);
    res.status(500).json({
      message: "Failed to create project. Please try again.",
    });
  }
});

app.post("/api/createDefaultProject", (req, res) => {
  db.createDefaultProject(req.body.userName);
});

/**
 *
 */
app.post("/api/addUserToProject", (req, res) => {
  console.log(
    "Adding user " + req.body.username + " to project " + req.body.projectID
  );
  db.addUserToProject(req.body.username, req.body.projectID);
});

app.get("/api/userProjects", async (req, res) => {
  console.log("retrieving user projects for: " + req.query.userName);
  try {
    const projects = await db.getUserProjects(req.query.userName);
    res.status(200).json({
      message: "Projects Retrieved Successfully",
      projects: projects, // Sending the retrieved projects in the response
    });
  } catch (error) {
    console.error("Error retrieving projects: ", error);
    res.status(500).json({
      message: "Failed to retrieve projects. Please try again.",
    });
  }
});

app.get("/api/userDashboards", async (req, res) => {
  console.log("retrieving user dashboards for: " + req.query.username);
  try {
    const dashboards = await db.getUserDashboards(req.query.username);
    res.status(200).json({
      message: "Projects Retrieved Successfully",
      dashboards: dashboards, // Sending the retrieved projects in the response
    });
  } catch (error) {
    console.error("Error retrieving projects: ", error);
    res.status(500).json({
      message: "Failed to retrieve projects. Please try again.",
    });
  }
});

/*
 * Get functions read data from table and pass it to user
 */

/**
 *
 */
app.get('/api/readUserProjects', async (req, res) => {
  try {
    const userName = jwt.verify(req.cookies.token, "ibby").userName;
    const projects = await db.getUserProjects(userName);
    const ownerName =jwt.verify(req.cookies.token, "ibby").firstName;
    console.log('Projects:', projects);
    const projectRecords = projects.map((project, index) => ({
      recordNumber: project.projectID, 
      owner: project.projectOwner, 
      ownerOrg: project.projectName, // Replace with actual property
      dashboardNumber: project.dashboards, // Replace with actual property
      dashboardName: "", // Replace with actual property
      escalate: "no", // Replace with actual property
    }));
    console.log('Projects:', projects);
    
    res.status(200).json({ projectRecords }); // Sending projects as JSON response
  } catch (err) {
    console.error('Error in readUserProjects:', err);
    res.status(500).json({ error: 'Internal server error' }); // Sending an error response
  }
  });
  
app.get("/api/allUserIDs", (req, res) => {
  console.log("Looking for all UserIds");
  db.findAllUserIds()
    .then((data) => {
      console.log(data);
      res.send(data);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("Error retrieving user IDs");
    });
});

app.get("/api/allProjectIDs", (req, res) => {
  console.log("Looking for all project Ids");
  db.findAllProjectIDs()
    .then((data) => {
      console.log(data);
      res.send(data);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("Error retrieving project IDs");
    });
});

app.get("/api/allUsernames", (req, res) => {
  console.log("Looking for all usernames");
  db.findAllUsernames()
    .then((data) => {
      console.log(data);
      res.send(data);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("Error retrieving usernames ");
    });
});

app.post("/api/getUser", (req, res) => {
  console.log("Looking for user");
  console.log(req.body);
  db.getUser(req.body.username)
    .then((data) => {
      console.log(data);
      res.send(data);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("Error retrieving user");
    });
});

app.get("/api/getCompanyGlossary", (req, res) => {
  console.log("Looking for Company Glossary");
  console.log(req.body);
  db.getGlossary()
    .then((data) => {
      console.log(data);
      res.send(data);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("Error retrieving user");
    });
});

app.get("/api/getOrganizationGlossary", (req, res) => {
  console.log("Looking for Organization Glossary");
  console.log(req.body);
  db.getOrganization()
    .then((data) => {
      console.log(data);
      res.send(data);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("Error retrieving user");
    });
});

app.post("/api/getProject", (req, res) => {
  console.log("Looking for project");
  console.log(req.body);
  db.getProject(req.body.projectId)
    .then((data) => {
      console.log(data);
      res.send(data);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("Error retrieving project");
    });
});

app.post("/api/login", async (req, res) => {
  console.log("Logging in " + req.body.username);
  const username = req.body.username;
  const password = req.body.password;
  console.log(username, password, req.body);

  const user = await db.getUser(username);

  if (!user || user.password !== password) {
    return res.status(403).json({
      error: "invalid login",
    });
  }

  delete user.password;

  const token = jwt.sign(user, "ibby", { expiresIn: "1h" });

  res.cookie("token", token, { maxAge: 60 * 60 * 1000 });
  res.cookie("firstName", user.userName, {maxAge: 60 * 60 * 1000});
  res.status(200).json({ success: true });
});

// Update user's projects list
app.put("/api/users/addproject", async (req, res) => {
  console.log("Adding project to user");
  console.log(req.body);
  const userid = req.body.userid;
  const projectid = req.body.projectid;

  console.log(userid);
  console.log(projectid);

  db.addProjectToUser(userid, projectid)
    .then((data) => {
      console.log(data);
      res.send(data);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("Error retrieving user");
    });
});

// Update project's users list
app.put("/api/projects/adduser", async (req, res) => {
  console.log("Adding user to project");
  console.log(req.body);
  const projectId = req.body.projectId;
  const userId = req.body.userId;
  const role = req.body.role;

  console.log(projectId);
  console.log(userId);
  console.log(role);

  db.addUserToProject(projectId, userId, role)
    .then((data) => {
      console.log(data);
      res.send(data);
    })
    .catch((error) => {
      console.error(error);
      res.status(500).send("Error adding user to project");
    });
});

app.post("/api/createNewDashboard", async (req, res) => {
  console.log("Creating Dashboard");
  console.log(req.body);
  try {
    const dashboardDetails = req.body;

    // Call the createDashboard function with provided dashboard details
    const createdDashboard = await db.createDashboard(dashboardDetails);
    console.log("DONE CREATING DASHBOARD");
    // Respond with the created dashboard object
    res.status(201).json({
      message: "Dashboard created successfully",
      dashboard: createdDashboard,
    });
  } catch (error) {
    // Respond with error message
    console.error("Error creating dashboard:", error);
    res.status(500).json({ message: "Failed to create dashboard" });
  }
});

// Route to get a dashboard by ID
app.post("/api/getDashboard", async (req, res) => {
  try {
    console.log("Looking for dashboard");
    console.log(req.body);

    // Assuming dashboardID is sent in the request body
    const dashboardID = req.body.dashboardID;

    // Fetch the dashboard object from the database
    const dashboard = await db.getDashboard(dashboardID);

    if (dashboard) {
      console.log("Dashboard found:", dashboard);
      res.json(dashboard);
    } else {
      console.log("Dashboard not found");
      res.status(404).json({ message: "Dashboard not found" });
    }
  } catch (error) {
    console.error("Error retrieving dashboard:", error);
    res.status(500).json({ message: "Error retrieving dashboard" });
  }
});

app.post("/api/saveDashboard", async (req, res) => {
  console.log("Saving Dashboard");
  console.log(req.body);
  try {
    // Update the dashboard entry in the DynamoDB table
    await db.updateDashboard(req.body);

    res.status(200).json({ message: "Dashboard updated successfully" });
  } catch (error) {
    console.error("Error updating dashboard:", error);
    res.status(500).json({ message: "Failed to update dashboard" });
  }
});

app.post("/api/deleteDashboard", async (req, res) => {
  console.log(req.body);
  console.log("Deleting Dashboard: ", req.body.dashid);
  try {
    // Update the project entry in the DynamoDB table
    await db.deleteDashboard(req.body.dashid);

    res.status(200).json({ message: "Dashboard deleted successfully" });
  } catch (error) {
    console.error("Error updating Dashboard:", error);
    res.status(500).json({ message: "Failed to delete Dashboard" });
  }
});

app.post("/api/saveProject", async (req, res) => {
  console.log("Updating Project Information");
  console.log(req.body);
  try {
    const updatedProjectData = req.body;

    // Update the project entry in the DynamoDB table
    await db.updateProject({
      updatedProjectData,
    });

    res.status(200).json({ message: "Project updated successfully" });
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ message: "Failed to update project" });
  }
});

app.post("/api/deleteProject", async (req, res) => {
  console.log(req.body);
  console.log("Deleting project: ", req.body.projectId);
  try {
    const updatedProjectData = req.body.projectData;

    // Update the project entry in the DynamoDB table
    await db.deleteProject(req.body.projectId);

    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ message: "Failed to delete project" });
  }
});

app.post("/api/mergeDashboards", async (req, res) => {
  console.log("Merging Dashboards");

  const { dashboard1Id, dashboard2Id, ownerId } = req.body;

  try {
    // Fetch details of both dashboards
    const dashboard1 = await db.getDashboard(dashboard1Id);
    const dashboard2 = await db.getDashboard(dashboard2Id);

    // Merge projects
    const mergedProjects = [...dashboard1.projects, ...dashboard2.projects];

    // Merge accessUserIDs (if needed)
    const mergedAccessUserIDs = [
      ...new Set([...dashboard1.accessUserIDs, ...dashboard2.accessUserIDs]),
    ];

    // Construct the merged dashboard object
    const mergedDashboard = {
      dashboardName: `Merged Dashboard (${dashboard1.dashboardName} + ${dashboard2.dashboardName})`,
      userID: ownerId,
      accessUserIDs: [ownerId],
      projects: mergedProjects,
    };

    // Save the merged dashboard to the database
    await db.createDashboard(mergedDashboard);

    res.send({ message: "Dashboards merged successfully!" });
  } catch (error) {
    console.error("Error merging dashboards:", error);
    res.status(500).send("Failed to merge dashboards. Please try again.");
  }
});

/**
 * POST to get Risks from risks table
 */
app.get('/api/getRisks', async (req, res) => {
  try {
    const jwtInfo = jwt.verify(req.cookies.token, "ibby");
    const userName = jwtInfo.userName;

    const risks = await db.getUserRisks(userName)
    
    res.status(200).json({ risks }); // Sending risks table as JSON response
  } catch (err) {
    console.error('Error in getRisks:', err);
    res.status(500).json({ error: 'Internal server error' }); 
  }
});

/**
 * POST to get Risks from project ID using getQualitaitiveKPI
 */
app.get('/api/getProjectRisks', async (req, res) => {
  try {
    const jwtInfo = jwt.verify(req.cookies.token, "ibby");
    const userFirstName = jwtInfo.userName;
    const projectId = req.query.projectId;
    
    let risks = [];
      const projectRisks = await db.getProjectRisks(projectId);
      if(  projectRisks == undefined || projectRisks.length == 0) { 
        null
      } else {
      for (const item of projectRisks) {
        if ((item.owner && item.owner == userFirstName) || (item.viewers && item.viewers.includes(userFirstName))) {
          risks.push(item);
        }
      }
      }
    
    res.status(200).json({ risks }); // Sending risks table as JSON response
  } catch (err) {
    console.error('Error in getProjectRisks:', err);
    res.status(500).json({ error: 'Internal server error' }); 
  }
});

/**
 * POST to get addd RIsk to risks list
 */
app.post('/api/addRisk', async (req, res) => {
  try {
    const reqData = req.body;
    const projectID = reqData.projectID;
    const jwtInfo = jwt.verify(req.cookies.token, "ibby");
    newEntry = reqData.newEntry;
    newEntry.owner = jwtInfo.userName; // Making created of risk  owner
    newEntry.viewers = []; 
    await db.addRisks(projectID, newEntry);

    res.status(200)
  } catch (err) {
    console.error('Error in addRisk:', err);
    res.status(500).json({ error: 'Internal server error' }); 
  }
});

app.post('/api/escalateRisk', async (req, res) => {  
  try {
    const reqData = req.body;
    const riskID = reqData.riskID;
    await db.escalateRisk(riskID);

    res.status(200)
  } catch (err) {
    console.error('Error in escalateRisk', err);
    res.status(500).json({ error: 'Internal server error' }); 
  }
});

/**
 * POST to edit a risk
 */
app.post('/api/editRisk', async (req, res) => {
  try {
    const reqData = req.body;
    const newEntry = reqData.newEntry;
    const riskID = newEntry.recordNumber;
    await db.editRisk(riskID, newEntry);

    res.status(200)
  } catch (err) {
    console.error('Error in editRisk:', err);
    res.status(500).json({ error: 'Internal server error' }); 
  }
});