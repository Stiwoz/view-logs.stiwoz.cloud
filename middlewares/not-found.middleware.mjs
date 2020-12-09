const notFoundMiddleware = (notFoundPath) => (_req, res, _next) => {
  return res.status(404).sendFile(notFoundPath);
};
export default notFoundMiddleware;
