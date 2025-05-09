const express = require('express')
const app = express()
app.use(express.static('public')) //serve our files in public statically
app.listen(5001, () => {
    console.log("Server running on http://localhost:5001");
  });
const path = require('path');
const uploadRoute = require('./routes/upload');

const uploadRoutes = require('./routes/upload');
app.use('/', uploadRoutes); // Or app.use('/api', uploadRoutes);


// Serve images statically
app.use('/images', express.static(path.join(__dirname, 'images')));

// Use upload route
//app.use('/', uploadRoute);


const registerRoute = require('./routes/upload'); 

// Static serving for public folder
app.use(express.static(path.join(__dirname, 'public')));

// Parse JSON/form
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Register endpoint
app.use('/', uploadRoute);