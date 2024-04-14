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
app.get('/api/readUserProjects', async (req, res) => {
  try {
    const userID = jwt.verify(req.cookies.token, "ibby").userID;
    const projects = await db.queryProjectsWithUserId(userID);

    console.log('Projects:', projects);
    
    res.status(200).json({ projects }); // Sending projects as JSON response
  } catch (err) {
    console.error('Error in readUserProjects:', err);
    res.status(500).json({ error: 'Internal server error' }); // Sending an error response
  }
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

/**
 * 
 */
app.post('/api/createDashboard', async (req, res) => {
  const reqData = req.body;

  const jwtInfo = jwt.verify(req.cookies.token, "ibby");
  const userID = jwtInfo.userID;
  try {
    await db.createDashboard(reqData.dashboardName, reqData.projectID, userID,
      reqData.category, reqData.columnNames, reqData.rowNames, reqData.values);
    res.status(201).json({
      message: 'Dashboard created successfully'
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error creating dashboard',
      error: error.toString()
    });
  }
});

/**
 * POST to get qualitativeKPIS for testing purposes
 */
app.post('/api/getQualitativeKPI', async (req, res) => {
  try {
    const reqData = req.body;
    projectID = reqData.projectID;
    const qualitativeKPI = await db.getQualitativeKPIs(projectID);

    
    res.status(200).json({ qualitativeKPI }); // Sending qualitative KPI as JSON response
  } catch (err) {
    console.error('Error in getQualitativeKPI:', err);
    res.status(500).json({ error: 'Internal server error' }); 
  }
});

/**
 * POST to get Risks from project ID using getQualitaitiveKPI
 */
app.get('/api/getRisks', async (req, res) => {
  try {
    const jwtInfo = jwt.verify(req.cookies.token, "ibby");
    const projects = jwtInfo.projects;

    let risks = [];
    for (const projectID of projects) {
      const qualitativeKPI = await db.getQualitativeKPIs(projectID);

      for (const item of qualitativeKPI) {
      if (item.name === 'Risks') {
        risks.push({projectID: projectID, risk: item.table});
      }
      }
    }
    
    res.status(200).json({ risks: risks }); // Sending risks table as JSON response
  } catch (err) {
    console.error('Error in getRisks:', err);
    res.status(500).json({ error: 'Internal server error' }); 
  }
});

/**
 * POST to get add KPI's to kpi lists
 */
app.post('/api/addKPI', async (req, res) => {
  try {
    const reqData = req.body;
    projectID = reqData.projectID;
    tableName = reqData.tableName;
    newEntry = reqData.newEntry;
    await db.addQualitativeKPI(projectID, tableName, newEntry);

    res.status(200)
  } catch (err) {
    console.error('Error in addQualitativeKPI:', err);
    res.status(500).json({ error: 'Internal server error' }); 
  }
});

/**
 * POST to clear risks from the database
 */
app.post('/api/clearRisks', async (req, res) => {
  try {
    const reqData = req.body;
    const projectID = reqData.projectID;
    await db.emptyRisks(projectID);

    res.status(200).json({ message: 'Risks cleared successfully' });
  } catch (err) {
    console.error('Error in clearRisks:', err);
    res.status(500).json({ error: 'Internal server error' }); 
  }
});