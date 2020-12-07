const all = (logs, notFoundPath) => async (_req, res, next) => {
  try {
    const list = await logs.find({});
    if (list) {
      return res.json(list);
    }

    return res.status(404).sendFile(notFoundPath);
  } catch (error) {
    next(error);
  }
};

export default all;
