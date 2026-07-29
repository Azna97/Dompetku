function ensure(condition, message, status = 400) {
  if (!condition) {
    const error = new Error(message);
    error.status = status;
    throw error;
  }
}

function buildCrudController(label, options) {
  return {
    async create(req, res, next) {
      try {
        options.validateCreate(req);
        await options.create(req);
        res.status(201).json({ ok: true });
      } catch (error) { next(error); }
    },
    async update(req, res, next) {
      try {
        options.validateUpdate(req);
        const result = await options.update(req);
        ensure(result?.changes, `${label} tidak ditemukan.`, 404);
        res.json({ ok: true });
      } catch (error) { next(error); }
    },
    async remove(req, res, next) {
      try {
        const result = await options.remove(req);
        ensure(result?.changes, `${label} tidak ditemukan.`, 404);
        res.json({ ok: true });
      } catch (error) { next(error); }
    }
  };
}

module.exports = { ensure, buildCrudController };
