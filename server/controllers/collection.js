import { notFound } from '../utils/errors.js';

/** Generic CRUD + reorder handlers for simple ordered collections (skills, experience). */
export function collectionController(Model, { label, sort }) {
  const find = async (id) => {
    const doc = await Model.findById(id);
    if (!doc) throw notFound(`${label} not found`);
    return doc;
  };

  return {
    async list(_req, res) {
      res.json(await Model.find().sort(sort).lean());
    },
    async get(req, res) {
      res.json(await find(req.params.id));
    },
    async create(req, res) {
      const data = { ...req.body };
      if (data.order === undefined) data.order = await Model.countDocuments();
      res.status(201).json(await Model.create(data));
    },
    async update(req, res) {
      const doc = await find(req.params.id);
      const data = { ...req.body };
      if (data.order === undefined) delete data.order;
      doc.set(data);
      await doc.save();
      res.json(doc);
    },
    async remove(req, res) {
      const doc = await find(req.params.id);
      await doc.deleteOne();
      res.json({ ok: true });
    },
    async reorder(req, res) {
      await Model.bulkWrite(req.body.ids.map((id, order) => ({ updateOne: { filter: { _id: id }, update: { $set: { order } } } })));
      res.json({ ok: true });
    },
  };
}
