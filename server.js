const session = require('express-session');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const path = require('path');
const express = require('express');
const app = express();


app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(session({
  secret: 'password', // change to a strong random string in production
  resave: false,
  saveUninitialized: true //false,
}));

// Middleware to parse form data
app.use(express.static(__dirname));

app.get('/session-test', (req, res) => {
  res.json(req.session);
});

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password', // use your MySQL password if needed
  database: 'userdb' //userdb
});




db.connect((err) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Connected to the database');
  }
});



const port = 3000;
// Start server
app.listen(port, () => {
  console.log(`Express server running at http://localhost:${port}/`);
});

// MySQL connection



app.get('/welcome', (req, res) => {
  if (!req.session.username) {
    return res.redirect('/login'); // Redirect to login if user is not logged in
  }

  // If logged in, show the welcome page
   res.sendFile(path.join(__dirname, 'welcome.html'));
});









app.post('/register', (req, res) => {
  const username = req.body.newusername;
    
  const password = req.body.password;

  if (!username || !password) {
    return res.status(400).send('Username and password are required.');
  }
 const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    
    
  const checkSql = 'SELECT COUNT(*) AS count FROM users WHERE username = ?';
  db.query(checkSql, [username], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send('Server error');
    }

    
 if (results[0].count > 0) {
      // Username taken
      return res.status(409).send('Username already exists.');
    }
    
       const insertSql = 'INSERT INTO users (username, password) VALUES (?, ?)';
    db.query(insertSql, [username, hashedPassword], (err2) => {
      if (err2) {
        console.error('Insert error:', err2);
        return res.status(500).send('Could not create user.');
      }
      res.redirect('/welcome');
        return;
    });
  });
});








    
// POST route for login
app.post('/login', (req, res) => {
  const username = req.body.username;
    const password = req.body.password;
    
     console.log('Username:', username);  // Check if it's being received correctly
  console.log('Password:', password);
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex')
 console.log('Hashed Password during login:', hashedPassword);  // Debugging line
  
  
  const sql = 'SELECT * FROM users WHERE username = ? AND password = ?';
    
  db.query(sql, [username, hashedPassword], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Server error' });
    }

    if (results.length > 0) {
         const storedHashedPassword = results[0].password;
       if (hashedPassword === storedHashedPassword) {
        req.session.username = username;  // Set session if passwords match
        return res.status(200).json({ message: 'Login successful' });
      } else {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
    } else {
      // Username not found
      return res.status(401).json({ message: 'Invalid credentials' });
    }
  });
});



app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Error during logout' });
    }

    // Send a success message upon logout
    res.status(200).json({ message: 'Logged out successfully' });
  });
});




 

// Serve guest.html on the /guest route
app.get('/guest', (req, res) => { 
  res.sendFile(path.join(__dirname, 'guest.html'));
});

// this is the guest reg
app.post('/guest-register', (req, res) => {
      console.log("GUEST REGISTER HIT"); 
     if (!req.session.username) {
         return res.status(401).send('Unauthorized');
    }
        

  const { user_id, Name, Phone, Age } = req.body;
     const dateformtime  = new Date().toISOString().slice(0, 19).replace('T', ' '); 

  if (!Name || !Phone ||!Age) {
    return res.status(400).json({ message: 'All fields are required.' });
  }
    
  const checkUserExistsQuery = 'SELECT * FROM users WHERE id = ?';
  db.query(checkUserExistsQuery, [user_id], (err, results) => {
    if (err) {
      console.error('Error checking user existence:', err);
      return res.status(500).json({ message: 'Error checking user existence.' });
    }
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    

 const insertQuery = `
    INSERT INTO storeDB.guests (user_id, name, phone, age, dateformtime )
    VALUES (?, ?, ?, ?, ?)
  `;
    
  db.query(insertQuery, [user_id, Name, Phone, Age, dateformtime], (err, results) => {
    if (err) {
        console.error('Guest Register DB Error:', err);
      return res.status(500).json({ message: 'Error adding guest to the database.' });
    }
const newGuestId = results.insertId; // Get the new guest's ID from the database
    res.status(200).json({
      message: 'Guest successfully registered!',
      guestId: newGuestId,
      Name,
      Phone,
      Age
    });
  });

});
});




app.post('/checkin', (req, res) => {
  const { user_id } = req.body;
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
 
 const query = `
  INSERT INTO storeDB.checkins   
  (user_id, checkin_date, times_checked_in)
  VALUES (?, ?, 1)
  ON DUPLICATE KEY UPDATE times_checked_in = times_checked_in + 1
`;
     const countQuery = `
    SELECT COUNT(*) AS guest_count
    FROM storeDB.checkins
    WHERE checkin_date = ?
  `;

  db.query(query, [user_id, today], (err, result) => {
    if (err) {
      console.error('Error checking in:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }


    
    db.query(countQuery, [today], (err, countResult) => {
      if (err) {
        console.error('Error fetching guest count:', err);
    return res.status(500).json({ message: 'Internal server error' });
      } 
    
   
    console.log('Count query result:', countResult);

    });
      });
    });

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
//update demo 




    app.post('/update-demographics', (req, res) => {
  const username = req.session.username;
        
  
  if (!username) {
    console.error('User not logged in. Session missing username.');
    return res.status(401).json({ error: 'Unauthorized, please log in.' });
  }
  
  const { full_name, age, phone, address } = req.body;

  const getUserIdQuery = 'SELECT id FROM users WHERE username = ?';
  db.query(getUserIdQuery, [username], (err, results) => {
    if (err) {
      console.error('Error fetching user ID:', err);
      return res.status(500).json({ error: 'Server error while fetching user ID.' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const userId = results[0].id;

    // Update the user_profiles table
    const updateSql = `
      UPDATE user_profiles
      SET full_name = ?, age = ?, phone = ?, address = ?
      WHERE user_id = ?
    `;
    
    db.query(updateSql, [full_name, age, phone, address, userId], (err2, results2) => {
      if (err2) {
        console.error('Update error:', err2);
        return res.status(500).json({ error: 'Error updating user information.' });
      }

      // Return a successful response in JSON format
      res.status(200).json({ message: 'Demographic information updated successfully.' });
    });
  });
});
// Catch-all for unknown routes
app.use((req, res) => {
  res.status(404).send('Not Found');
});


