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

module.exports = router;
