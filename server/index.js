// server/index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const resultsRouter = require('./routes/results');

const app = express();

app.use(cors());
app.use(express.json());

// Health check — useful to verify deployment is alive
app.get('/', (req, res) => {
  res.json({ status: 'QA Monitor API is running' });
});

// All result routes live under /api/results
app.use('/api/results', resultsRouter);

// Connect to MongoDB then start server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(process.env.PORT || 5000, () => {
      console.log(`Server running on port ${process.env.PORT || 5001}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });