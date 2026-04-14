const express = require('express');
const cors = require('cors');
const riskRoutes = require('./routes/risk');
const claimRoutes = require('./routes/claim');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Basic sanity check route
app.get('/', (req, res) => {
  res.send('GigShield Backend Running');
});

app.use('/calculate-risk', riskRoutes);
app.use('/create-claim', claimRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
