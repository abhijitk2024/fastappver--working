const express = require('express');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const db = require('./db_conn');
const app = express();
const PORT = 5000;


app.use(cors({
  origin: 'http://localhost:3000', // Allow only the frontend origin
  credentials: true // Allow credentials (cookies, headers)
}));


// Additional CORS headers
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  next();
});


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: true
}));


// Define the directory where the PDF files are stored
const pdfDirectory = path.join('D:/ArdurTech/pdf');

// Serve the PDF files
app.use('/pdf-files', express.static(pdfDirectory));

// Existing API endpoints
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await db.query('SELECT * FROM fav_usermaster WHERE fav_username = ? AND fav_userpwd = ?', [username, password]);
    if (rows.length > 0) {
      req.session.username = username;
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'An error occurred. Please try again later.' });
  }
});


// Save form data and fetch section name and parameter name
app.post('/api/save-form-and-fetch-section', async (req, res) => {
  let formData = req.body;
  let connection;

  try {
    // Remove FAV_VerSecName and FAV_VerParamName from formData
    const { FAV_VerSecName, FAV_VerParamName, ...insertData } = formData;
    
    // Start a transaction
    connection = await db.getConnection();
    await connection.beginTransaction();

    // Insert form data
    const [insertResult] = await connection.query('INSERT INTO FAV_CaseDetails SET ?', insertData);
    
    // Execute the SELECT statement to get the section name and parameter name
    const [selectResult] = await connection.query(`
      SELECT a.FAV_VerSecID, a.FAV_VerSecName, b.FAV_VerParamID, b.FAV_VerParamName, FAV_VerParamDesc
      FROM fav_versecmaster a
      JOIN fav_verparammaster b ON a.FAV_VerSecID = b.FAV_VerSecMstRefID
      ORDER BY a.FAV_VerSecID, b.FAV_VerParamID ASC
      LIMIT 1 OFFSET 0
    `);

    // Extract the sectionName and paramName from the select result
    const sectionName = selectResult.length > 0 ? selectResult[0].FAV_VerSecName : null;
    const paramName = selectResult.length > 0 ? selectResult[0].FAV_VerParamName : null;
    const paramDesc = selectResult.length > 0 ? selectResult[0].FAV_VerParamDesc : null;

    // Commit the transaction
    await connection.commit();

    // Send the response with both the insert ID and section name
    res.json({ success: true, id: insertResult.insertId, sectionName, paramName, paramDesc });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error saving form data and fetching section name and parameter name:', error);
    res.status(500).json({ message: 'An error occurred while saving form data and fetching section name and parameter name.' });
  } finally {
    if (connection) connection.release();
  }
});

app.get('/api/parameter-description', async (req, res) => {
  const { param } = req.query;
  let connection;

  try {
    connection = await db.getConnection();
    const [selectResult] = await connection.query(`
      SELECT FAV_VerParamDesc 
      FROM fav_verparammaster 
      WHERE FAV_VerParamName = ?
    `, [param]);

    if (selectResult.length > 0) {
      res.json({ description: selectResult[0].FAV_VerParamDesc });
    } else {
      res.status(404).json({ message: 'Description not found' });
    }
  } catch (error) {
    console.error('Error fetching parameter description:', error);
    res.status(500).json({ message: 'An error occurred while fetching parameter description.' });
  } finally {
    if (connection) connection.release();
  }
});

app.post('/api/save-remark', async (req, res) => {
  const { FileNo, VendorName, CaseStatus, Section, parameterName, remark, user, date } = req.body;
  let connection;

  try {
    connection = await db.getConnection();
    const [result] = await connection.query(`
      INSERT INTO FAV_FileRemarkDtl (FAV_FRDFileNo, FAV_FRDVendorName, FAV_FRDCaseStatus, FAV_FRDCaseSection, FAV_FRDVerParam, FAV_FRDVerRemark, FAV_CreatedBy, FAV_CreatedDate) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [FileNo, VendorName, CaseStatus, Section, parameterName, remark, user, date]
    );

    res.json({ success: true, id: result.insertId });
  } catch (error) {
    console.error('Error saving remark:', error);
    res.status(500).json({ message: 'An error occurred while saving the remark.' });
  } finally {
    if (connection) connection.release();
  }
});




app.get('/api/next-parameter', async (req, res) => {
  const { currentParam } = req.query;
  let connection;

  try {
    connection = await db.getConnection();
    const [selectResult] = await connection.query(`
      SELECT a.FAV_VerSecName, b.FAV_VerParamName
      FROM fav_versecmaster a
      JOIN fav_verparammaster b ON a.FAV_VerSecID = b.FAV_VerSecMstRefID
      WHERE b.FAV_VerParamSeqNo > (SELECT FAV_VerParamSeqNo FROM fav_verparammaster WHERE FAV_VerParamName = ? )
      ORDER BY b.FAV_VerParamSeqNo
      LIMIT 1 OFFSET 0
    `, [currentParam]);

    if (selectResult.length > 0) {
      res.json({ sectionName: selectResult[0].FAV_VerSecName, paramName: selectResult[0].FAV_VerParamName });
    } else {
      res.status(404).json({ message: 'No more parameters found' });
    }
  } catch (error) {
    console.error('Error fetching next parameter:', error);
    res.status(500).json({ message: 'An error occurred while fetching the next parameter.' });
  } finally {
    if (connection) connection.release();
  }
});



app.get('/api/back-parameter', async (req, res) => {
  const { currentParam } = req.query;
  let connection;

  try {
    connection = await db.getConnection();
    const [selectResult] = await connection.query(`
      SELECT a.FAV_VerSecName, b.FAV_VerParamName
      FROM fav_versecmaster a
      JOIN fav_verparammaster b ON a.FAV_VerSecID = b.FAV_VerSecMstRefID
      WHERE b.FAV_VerParamSeqNo < (SELECT FAV_VerParamSeqNo FROM fav_verparammaster WHERE FAV_VerParamName = ? )
      ORDER BY b.FAV_VerParamSeqNo
      LIMIT 1 OFFSET 0
    `, [currentParam]);

    if (selectResult.length > 0) {
      res.json({ sectionName: selectResult[0].FAV_VerSecName, paramName: selectResult[0].FAV_VerParamName });
    } else {
      res.status(404).json({ message: 'No more parameters found' });
    }
  } catch (error) {
    console.error('Error fetching next parameter:', error);
    res.status(500).json({ message: 'An error occurred while fetching the next parameter.' });
  } finally {
    if (connection) connection.release();
  }
});


// Endpoint to fetch tasks
app.get('/api/tasks', async (req, res) => {
  try {
    // Assuming FAV_ATAFileNo, FAV_ATAFileType, FAV_ATATaskPriority, FAV_ATATaskDueDt are the required columns
    const [rows] = await db.query(`
      SELECT FAV_ATAFileNo, FAV_ATAFileType, FAV_ATATaskPriority, FAV_ATATaskDueDt  
      FROM fav_admtaskallocation 
      WHERE FAV_ATAFileVerStatus = 'To Do' 
      ORDER BY FAV_ATASeqId ASC
    `);

    res.json({ tasks: rows });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'An error occurred while fetching tasks.' });
  }
});


// Route to save coordinates
/*app.post('/save-coordinates', (req, res) => {
  const { x, y, pageNumber } = req.body;
  const insertQuery = 'INSERT INTO coordinates (x, y, page_number) VALUES (?, ?, ?)';
  db.query(insertQuery, [x, y, pageNumber], (err, result) => {
      if (err) {
          console.error('Error inserting coordinates:', err);
          res.status(500).send('Error inserting coordinates');
          return;
      }
      res.send('Coordinates saved successfully');
  });
});*/



// Endpoint to save coordinates and form data
app.post('/save-coordinates', (req, res) => {
  const {
      sectionRefId,
      paramID,
      verRefId,
      parameterName,
      parameterDesc,
      rejectCriteria,
      x,
      y,
      pageNumber
  } = req.body;

  // Validate required fields
  if (!sectionRefId || !verRefId || !parameterName || !parameterDesc || !rejectCriteria || x == null || y == null || pageNumber == null) {
      return res.status(400).json({ message: 'Please fill in all required fields.' });
  }

  const query = `
      INSERT INTO fav_verparammaster (
      FAV_VerSecMstRefID, 
      FAV_VerParamID, 
      FAV_VerRefID, 
      FAV_VerParamName, 
      FAV_VerParamDesc, 
      FAV_VerRejCriteria, 
      FAV_VerPdfPgX, 
      FAV_VerPdfPgY, 
      FAV_VerPdfPgRef)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
      query,
      [sectionRefId, paramID, verRefId, parameterName, parameterDesc, rejectCriteria, x, y, pageNumber],
      (err, result) => {
          if (err) {
              console.error('Error inserting data:', err);
              return res.status(500).json({ message: 'Error saving data.' });
          }
          res.status(200).json({ message: 'Data saved successfully!' });
      }
  );
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

