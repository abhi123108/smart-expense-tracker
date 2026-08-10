require('dotenv').config();
const connectDB = require('./config/db');
const createApp = require('./app');

connectDB();

const app = createApp();
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
