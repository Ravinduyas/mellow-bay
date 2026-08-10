import 'dotenv/config';
import { createApp } from './app.js';

const port = Number(process.env.PORT ?? 4000);
const app = createApp();

app.listen(port, () => {
  console.log(`[api] listening on http://localhost:${port}`);
  if (!process.env.ADMIN_TOKEN) {
    console.warn(
      '[api] ADMIN_TOKEN is not set — price writes and the enquiry list will return 503 until it is.',
    );
  }
});
