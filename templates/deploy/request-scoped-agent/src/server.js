// Recognized Node.js server entrypoint. Request work ends when the response ends.
import { createServer } from './proxy.js';

const server = createServer();
server.listen(Number(process.env.PORT || 3000));

export { server };
