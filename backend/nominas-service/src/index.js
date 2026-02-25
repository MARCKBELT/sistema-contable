const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ service: 'nominas-service', status: 'UP' });
});

app.listen(PORT, () => {
  console.log(`👥 Nóminas Service corriendo en puerto ${PORT}`);
});
