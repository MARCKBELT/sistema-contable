const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ service: 'contabilidad-service', status: 'UP' });
});

app.listen(PORT, () => {
  console.log(`📊 Contabilidad Service corriendo en puerto ${PORT}`);
});
