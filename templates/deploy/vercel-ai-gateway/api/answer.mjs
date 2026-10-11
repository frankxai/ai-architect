import { handleAnswer } from '../lib/runtime.mjs';

export const config = { maxDuration: 30 };

export default {
  fetch(request) {
    return handleAnswer(request);
  },
};
