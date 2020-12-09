import path from 'path';
import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import yup from 'yup';
import monk from 'monk';
import dotenv from 'dotenv';

import all from './routes/all.get.mjs';
import last from './routes/last.get.mjs';
import detail from './routes/detail.get.mjs';
import logger from './routes/logger.post.mjs';
import deleteAll from './routes/all.delete.mjs';
import deleteDetail from './routes/detail.delete.mjs';
import notFoundMiddleware from './middlewares/not-found.middleware.mjs';
import genericErrorMiddleware from './middlewares/generic-error.middleware.mjs';

// Read .env
dotenv.config();

// Define error paths
const notFoundPath = path.join(path.resolve(''), 'public/404.html');
const errorPath = path.join(path.resolve(''), 'public/500.html');

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
