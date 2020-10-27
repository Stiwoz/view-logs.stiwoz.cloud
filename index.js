const path = require('path');
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const yup = require('yup');
const monk = require('monk');

// Read .env
require('dotenv').config();

// Setup express app & middlewares
const app = express();
app.enable('trust proxy');
app.use(helmet());
app.use(morgan('common'));
app.use(express.json());

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

app.get('/all', async (_req, res, next) => {
  try {
    const list = await logs.find({});
    if (list) {
      return res.json(list);
    }

    return res.status(404).sendFile(notFoundPath);
  } catch (error) {
    next(error);
  }
});

app.get('/last', async (_req, res, next) => {
  try {
    const last = await logs.findOne({}, { sort: { line: -1 }, limit: 1 });
    if (last) {
      return res.json(last);
    }

    return res.status(404).sendFile(notFoundPath);
  } catch (error) {
    next(error);
  }
});

app.get('/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    const log = await logs.findOne({ _id: monk.id(id) });
    if (log) {
      return res.json(log);
    }

    return res.status(404).sendFile(notFoundPath);
  } catch (error) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).sendFile(notFoundPath);
    } else {
      next(error);
    }
  }
});

app.post('/logger', async (req, res, next) => {
  const list = req.body;
  const result = [];
  try {
    list.forEach(async (row) => {
      const { timestamp, logContent, line } = row;
      await schema.validate({
        timestamp,
        logContent,
        line,
      });

      const log = {
        timestamp,
        logContent,
        line,
      };
      const created = await logs.insert(log);
      result.push(created);
    });

    return res.json(result);
  } catch (error) {
    next(error);
  }
});

app.delete('/all', async (_req, res, next) => {
  try {
    await logs.remove({}, { multi: true });
    return res.status(200).send('ok');
  } catch (error) {
    next(error);
  }
});

app.delete('/:id', async (req, res, next) => {
  const { id } = req.params;
  try {
    await logs.remove({ _id: monk.id(id) }, { multi: false });
    return res.status(200).send('ok');
  } catch (error) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).sendFile(notFoundPath);
    } else {
      next(error);
    }
  }
});

app.use((_req, res, _next) => {
  return res.status(404).sendFile(notFoundPath);
});

app.use((error, _req, res, _next) => {
  return res.status(error.status || 500).json({
    message:
      process.env.NODE_ENV === 'production' &&
      (error.status === 500 || !error.status)
        ? 'Qualcosa è andato storto'
        : error.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : error.stack,
  });
});

const port = process.env.PORT || 8080;
app.listen(port, '127.0.0.1', () => {
  console.log(`Listening at http://127.0.0.1:${port}`);
});
