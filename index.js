const path = require('path');
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const yup = require('yup');
const monk = require('monk');

import all from './routes/all.get';
import last from './routes/last.get';
import detail from './routes/detail.get';
import logger from './routes/logger.post';
import deleteAll from './routes/all.delete';
import deleteDetail from './routes/detail.delete';
import notFoundMiddleware from './middlewares/not-found.middleware';
import genericErrorMiddleware from './middlewares/generic-error.middleware';

// Read .env
require('dotenv').config();

// Setup express app & middlewares
const app = express();
app.enable('trust proxy');

// Lib middlewares
app.use(helmet());
app.use(morgan('common'));
app.use(express.json());

// Custom middlewares
app.use(notFoundMiddleware(notFoundPath));
app.use(genericErrorMiddleware());

// Get db
const db = monk(process.env.MONGODB_URI);

// Setup logs "table" indexes
const logs = db.get('logs');
logs.createIndex({ timestamp: 1 });
logs.createIndex({ line: 1 }, { unique: true });

// Define "table" constraints
const schema = yup.object().shape({
  timestamp: yup.date().required(),
  logContent: yup.string().trim().required(),
  line: yup.number().required(),
});

// Define error paths
const notFoundPath = path.join(__dirname, 'public/404.html');
const errorPath = path.join(__dirname, 'public/500.html');

// Declare routes

// GET
app.get('/all', all(logs, notFoundPath));
app.get('/last', last(logs, notFoundPath));
app.get('/:id', detail(logs, notFoundPath));

// POST
app.post('/logger', logger(schema, logs));

// DELETE
app.delete('/all', deleteAll(logs));
app.delete('/:id', deleteDetail(logs, notFoundPath));

// Start server
const port = process.env.PORT || 8000;
const host = process.env.HOST || '127.0.0.1';
app.listen(port, host, () =>
  console.log(`Listening at http://${host}:${port}`)
);
