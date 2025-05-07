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
  saveUninitialized: false //false,
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
  database: 'storedb' //userdb
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
    return res.redirect('http://localhost:3000/'); // Redirect to login if user is not logged in
     
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
    
       const insertSql = 'INSERT INTO users (username, password, billingDayOfMonth) VALUES (?, ?, ?)';
      
const currDate= new Date().getDate() ;

   
    db.query(insertSql, [username, hashedPassword, currDate], (err2) => {
      if (err2) {
        console.error('Insert error:', err2);
        return res.status(500).send('Could not create user.');
      }
       return res.redirect('http://localhost:3000/');
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
        req.session.username = username;
           
    req.session.user_Id= results[0].id ;
           // Set session if passwords match
        
      return res.redirect('/welcome');
      } else {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
    } else {
      // Username not found
      return res.status(401).json({ message: 'Invalid credentials' });
    }
  });
});



app.get('/api/username', (req, res) => {
  if (req.session.username) {
    res.json({ username: req.session.username });
  } else {
    res.status(401).json({ error: 'Not logged in' });
  }
});

//app.get('/api/', (req, res) => {
//  if (req.session.username) {
//    res.json({ username: req.session.username });
//  } else {
//    res.status(401).json({ error: 'Not logged in' });
//  }
//});



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
     

  const {Name, Phone, Age } = req.body;
     const datecreated  = new Date().toISOString().slice(0, 19).replace('T', ' '); 

          console.log("test"); 


 const insertQuery = `INSERT INTO storeDB.guest3 (id, name, phone, age, datecreated, affilUser ) VALUES (?, ?, ?, ?, ?, ?)
  `;
    const min = 100000;
  const max = 999999;
  const uid = Math.floor(Math.random() * (max - min + 1)) + min;
  db.query(insertQuery, [uid, Name, Phone, Age, datecreated,req.session.user_Id ], (err, results) => {
    if (err) {
        console.error('Guest Register DB Error:', err);
      return res.status(500).json({ message: 'Error adding guest to the database.' });
    }
 // Get the new guest's ID from the database
      const formattedDate = new Date(datecreated).toLocaleDateString('en-US');

    res.status(200).json({
      message: 'Guest successfully registered!',
      guestId:uid ,     
        Name,
      Phone,
      Age,
     datecreated :formattedDate
    });
  });


});



app.get('/getallguests', (req, res)  => {
   const checkSql = 'SELECT * FROM guest3 WHERE affilUser = ?' ;
  db.query(checkSql, [req.session.user_Id],(err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send('Server error');
    }
      res.send(results);
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
     const updateGuestQuery = `
    UPDATE guest3 SET checked_in = 1 WHERE id = ?
  `;

  db.query(query, [user_id, today], (err, result) => {
    if (err) {
      console.error('Error checking in:', err);
      return res.status(500).json({ message: 'Internal server error' });
    }
db.query(updateGuestQuery, [user_id], (err, updateResult) => {
      if (err) {
        console.error('Error updating guest3:', err);
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
     });
   

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
//update demo 






    app.post('/update-demographics', (req, res) => {
  const username = req.session.username;
    console.log(username);   
        
 const checkSql = 'SELECT COUNT(*) AS count FROM profile WHERE user_id = ?';
  db.query(checkSql, [username], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).send('Server error');
    }

const { full_name, age, phone, address } = req.body;

 if (results[0].count > 0) {

     const updateSql = `
      UPDATE profile
      SET full_name = ?, age = ?, phone = ?, address = ?
      WHERE user_id = ?
    `;
    
    db.query(updateSql, [full_name, age, phone, address, username], (err2, results2) => {
      if (err2) {
        console.error('Update error:', err2);
        return res.status(500).json({ error: 'Error updating user information.'+err2 });
      }

      // Return a successful response in JSON format
      res.status(200).json({ message: 'Demographic information updated successfully.' });
  
    
    });
      
    }  else{
          console.log("Start Insert Statement");
          const insertSql = 'INSERT INTO profile (user_id, full_name, age, phone, address) VALUES (?, ?, ?, ?,?)';
          console.log("username for insert: " + username);
    db.query(insertSql, [username, full_name,age,phone, address], (err2) => {
      if (err2) {
        console.error('Insert error:', err2);
        return res.status(500).send('Could not create user.');
      }
      res.status(200).json({ message: 'Demographic information updated successfully.' });
    });
     }
  });
});
 
        

   app.post('/submit-preference', (req, res) => {
  const gympreference  = req.body.gymPreference;
        if (!gympreference) {
    return res.status(400).send('No gym preference selected.');
  }
        const query = 'INSERT INTO preferences (gymPreference) VALUES (?)';
       
   db.query(query, [gympreference], (err, result) => {
    if (err) {
      console.error('Error inserting preference:', err);
      res.status(500).send('Server error');
      return;
    }
      
  });
});


// Catch-all for unknown routes


app.post('/amenities', (req,res) =>{
 const userId = req.session.user_id; 
    const {amenities} = req.body; 
   
   if (!userId) return res.status(401).send('Unauthorized');

  const amenityPrices = {
    "Wi-Fi": 10,
    "locker": 5,
    "pool": 20
  };        
          
  const selected = Array.isArray(amenities) ? amenities : [amenities];
  const values = selected.map(a => [userId, a, amenityPrices[a]]);

  const sql = 'INSERT INTO amenity_selections (user_id, amenity, price) VALUES ?';
  db.query(sql, [values], (err, result) => {
    if (err) return res.status(500).send('DB Error');
    res.send('Amenities submitted!');
  });        
          
});



app.use((req, res) => {
  res.status(404).send('Not Found');
});


