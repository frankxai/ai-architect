import { handleHealth } from '../lib/runtime.mjs';

export default {
  fetch() {
    return handleHealth();
  },
};
