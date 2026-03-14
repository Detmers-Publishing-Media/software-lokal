const { Router } = require('express');
const path = require('path');

const router = Router();
const publicDir = path.join(__dirname, '..', '..', 'public');

router.get('/', (req, res) => res.sendFile(path.join(publicDir, 'index.html')));
router.get('/buy/:product_id', (req, res) => res.sendFile(path.join(publicDir, 'buy.html')));
router.get('/buy/:product_id/success', (req, res) => res.sendFile(path.join(publicDir, 'buy.html')));
router.get('/support', (req, res) => res.sendFile(path.join(publicDir, 'support.html')));
router.get('/support/:case_number', (req, res) => res.sendFile(path.join(publicDir, 'support.html')));
router.get('/ideas', (req, res) => res.sendFile(path.join(publicDir, 'ideas.html')));
router.get('/ideas/:idea_number', (req, res) => res.sendFile(path.join(publicDir, 'ideas.html')));
router.get('/request', (req, res) => res.sendFile(path.join(publicDir, 'request.html')));
router.get('/request/:request_number', (req, res) => res.sendFile(path.join(publicDir, 'request.html')));
router.get('/status', (req, res) => res.sendFile(path.join(publicDir, 'status.html')));
router.get('/download', (req, res) => res.sendFile(path.join(publicDir, 'download.html')));
router.get('/product/:id', (req, res) => res.sendFile(path.join(publicDir, 'product.html')));
router.get('/product/:id/faq', (req, res) => res.sendFile(path.join(publicDir, 'product.html')));
router.get('/product/:id/install', (req, res) => res.sendFile(path.join(publicDir, 'product.html')));
router.get('/product/:id/releases', (req, res) => res.sendFile(path.join(publicDir, 'product.html')));
router.get('/transparency', (req, res) => res.sendFile(path.join(publicDir, 'transparency.html')));
router.get('/transparency/:product_id', (req, res) => res.sendFile(path.join(publicDir, 'transparency.html')));
router.get('/admin', (req, res) => res.sendFile(path.join(publicDir, 'admin.html')));
router.get('/danke', (req, res) => res.sendFile(path.join(publicDir, 'danke.html')));
router.get('/impressum', (req, res) => res.sendFile(path.join(publicDir, 'impressum.html')));
router.get('/datenschutz', (req, res) => res.sendFile(path.join(publicDir, 'datenschutz.html')));

module.exports = router;
