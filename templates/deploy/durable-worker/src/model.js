// The only module that may know a model provider's name.
// Swap this file to change providers. Do not import a provider SDK elsewhere.

export async function complete({ goal, step }) {
  if (!process.env.MODEL_API_KEY) {
    return { text: `[dry-run] ${step}: ${String(goal).slice(0, 80)}` };
  }
  throw new Error('live provider call is not wired in this kit; set no MODEL_API_KEY to stay on dry-run');
}
