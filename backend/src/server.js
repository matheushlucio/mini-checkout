const app = require('./app');

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`\x1b[36m╔══════════════════════════════════════╗\x1b[0m`);
  console.log(`\x1b[36m║   Mini Checkout API rodando!         ║\x1b[0m`);
  console.log(`\x1b[36m║   http://localhost:${PORT}             ║\x1b[0m`);
  console.log(`\x1b[36m║   API v1: /api/v1/...                ║\x1b[0m`);
  console.log(`\x1b[36m║   API v2: /api/v2/...                ║\x1b[0m`);
  console.log(`\x1b[36m╚══════════════════════════════════════╝\x1b[0m`);
});
