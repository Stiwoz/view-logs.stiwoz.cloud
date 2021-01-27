import path from 'path';
import express from 'express';
import morgan from 'morgan';
import helmet from 'helmet';
import yup from 'yup';
import monk from 'monk';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

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
const table = db.get('bw');
table.createIndex({ timestamp: 1 });
table.createIndex({ uuid: 1 }, { unique: true });

// Define "table" constraints
const schema = yup.object().shape({
  uuid: yup.string().trim().uuid().required().default(uuidv4()),
  timestamp: yup.date().required().default(new Date()),
  data: yup.object().required(),
});

// Declare routes

// GET
app.get('/all', all(table, notFoundPath));
app.get('/last', last(table, notFoundPath));
app.get('/:id', detail(table, notFoundPath));

// POST
app.post('/logger', logger(schema, table));

// DELETE
app.delete('/all', deleteAll(table));
app.delete('/:id', deleteDetail(table, notFoundPath));

// Start server
const port = process.env.PORT || 8000;
const host = process.env.HOST || '127.0.0.1';
app.listen(port, host, () =>
  console.log(`Listening at http://${host}:${port}`)
);
