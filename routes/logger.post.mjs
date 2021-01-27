const logger = (schema, logs) => async (req, res, next) => {
  const list = req.body;
  const result = [];
  try {
    list.forEach(async (row) => {
      const { timestamp, data } = row;
      const log = {
        data,
        timestamp,
      };

      await schema.validate(log);

      const created = await logs.insert(log);
      result.push(created);
    });

    return res.json(result);
  } catch (error) {
    next(error);
  }
};

export default logger;
