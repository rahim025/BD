require('dotenv').config();
const express = require('express');
const cors = require('cors');

const scenarioRoutes = require('./routes/scenario');
const generateRoutes = require('./routes/generate');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'App BD IA backend en ligne' });
});

app.use('/api/scenario', scenarioRoutes);
app.use('/api/generate', generateRoutes);

app.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});
