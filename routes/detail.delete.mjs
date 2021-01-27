const detail = (logs, notFoundPath) => async (req, res, next) => {
  const { uuid } = req.params;
  try {
    await logs.remove({ uuid }, { multi: false });
    return res.status(200).send('ok');
  } catch (error) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).sendFile(notFoundPath);
    } else {
      next(error);
    }
  }
};
export default detail;
