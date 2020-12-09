const all = (logs) => async (_req, res, next) => {
  try {
    await logs.remove({}, { multi: true });
    return res.status(200).send('ok');
  } catch (error) {
    next(error);
  }
};

export default all;
