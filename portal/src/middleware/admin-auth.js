const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

function adminAuth(req, res, next) {
  const bearer = (req.headers.authorization || '').replace('Bearer ', '');
  const token = bearer || req.headers['x-admin-token'] || req.query.admin_token;
  if (!token || token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

module.exports = adminAuth;
