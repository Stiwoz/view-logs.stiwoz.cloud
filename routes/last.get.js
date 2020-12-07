const last = (logs, notFoundPath) => async (_req, res, next) => {
  try {
    const last = await logs.findOne({}, { sort: { line: -1 }, limit: 1 });
    if (last) {
      return res.json(last);
    }

    return res.status(404).sendFile(notFoundPath);
  } catch (error) {
    next(error);
  }
};
export default last;
