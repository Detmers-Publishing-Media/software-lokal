const { Router } = require('express');
const pool = require('../db/pool');
const yamlGen = require('../services/yaml-generator');

const router = Router();

router.post('/api/ideas', async (req, res) => {
  try {
    const { title, description, submitter_email, submitter_name, category } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'title und description sind Pflicht' });
    }

    const { rows: [{ nextval }] } = await pool.query("SELECT nextval('seq_ideas')");
    const ideaNumber = `IDEA-${String(nextval).padStart(6, '0')}`;

    const { rows: [idea] } = await pool.query(
      `INSERT INTO ideas (idea_number, title, description, submitter_email, submitter_name, category)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [ideaNumber, title, description, submitter_email || null, submitter_name || null, category || 'new_product']
    );

    const yaml = yamlGen.generateIdeaYaml(idea);
    await pool.query(
      'INSERT INTO dispatch_queue (source_type, source_id, yaml_content) VALUES ($1, $2, $3)',
      ['idea', idea.id, yaml]
    );

    res.status(201).json({ idea_number: ideaNumber, status: idea.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/api/ideas', async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT idea_number, title, description, category, status, votes, created_at FROM ideas WHERE status IN ('submitted', 'accepted') ORDER BY votes DESC, created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/api/ideas/:idea_number', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT idea_number, title, description, category, status, votes, created_at FROM ideas WHERE idea_number = $1',
      [req.params.idea_number]
    );
    if (!rows.length) return res.status(404).json({ error: 'Idee nicht gefunden' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/api/ideas/:idea_number/vote', async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'UPDATE ideas SET votes = votes + 1, updated_at = NOW() WHERE idea_number = $1',
      [req.params.idea_number]
    );
    if (!rowCount) return res.status(404).json({ error: 'Idee nicht gefunden' });
    res.json({ voted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
