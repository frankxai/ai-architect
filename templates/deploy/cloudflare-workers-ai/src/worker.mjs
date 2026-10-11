// Worker entry module. Only the default export lives here: workerd rejects any
// other named export that is not a handler or entrypoint class.
import { route } from './adapter.mjs';

export default {
  fetch(request, env) {
    return route(request, env);
  },
};
