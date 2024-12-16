require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const usageRoutes = require('./routes/usageRoutes');

const app = express();

app.use(bodyParser.json());
app.use(cors());

app.use('/', usageRoutes);
  // Use the log routes
  //app.use('/api/logs', logRoutes);

const PORT = process.env.PORT || 5000;  // This sets the port to 5000 by default
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

mongoose.connect('mongodb+srv://pakhtar635:khund123@cloudclusterfinal.vhico.mongodb.net/cloudproject')
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
  });


process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
  });
 

  