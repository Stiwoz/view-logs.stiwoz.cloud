const detail = (logs, notFoundPath) => async (req, res, next) => {
  const { uuid } = req.params;
  try {
    const log = await logs.findOne({ uuid });
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
};
export default detail;
