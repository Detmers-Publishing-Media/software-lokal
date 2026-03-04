const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORTAL_PORT || 3200;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use(require('./routes/api-buy'));
app.use(require('./routes/api-digistore-ipn'));
app.use(require('./routes/api-support'));
app.use(require('./routes/api-ideas'));
app.use(require('./routes/api-requests'));
app.use(require('./routes/api-status'));
app.use(require('./routes/api-texts'));
app.use(require('./routes/api-test-reports'));
app.use(require('./routes/pages'));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Portal v0.6.0 on :${PORT}`);
});
