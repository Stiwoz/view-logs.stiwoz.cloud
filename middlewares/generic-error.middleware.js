const genericErrorMiddleware = () => (error, _req, res, _next) => {
  return res.status(error.status || 500).json({
    message:
      process.env.NODE_ENV === 'production' &&
      (error.status === 500 || !error.status)
        ? 'Qualcosa è andato storto'
        : error.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : error.stack,
  });
};

export default genericErrorMiddleware;
