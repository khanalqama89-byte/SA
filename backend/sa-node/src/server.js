const http = require('http');
const app = require('./app');

const PORT = process.env.PORT || 8080;

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 SA Document Converter Node.js Backend is running!`);
  console.log(`📡 Listening on: http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
  console.log(`⚙️  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`====================================================`);
});
