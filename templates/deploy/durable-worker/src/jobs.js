import { complete } from './model.js';
import { asData } from './trust.js';

const jobs = new Map();
const queue = [];
let seq = 0;

const BUDGET_STEPS = 4;

export function enqueue(goal) {
  const id = `job_${++seq}`;
  const job = {
    id,
    goal,
    status: 'queued',
    step: 0,
    budget: BUDGET_STEPS,
    log: [],
  };
  jobs.set(id, job);
  queue.push(id);
  return job;
}

export function getJob(id) {
  return jobs.get(id) || null;
}

export async function processNext() {
  const id = queue.shift();
  if (!id) return { idle: true };
  const job = jobs.get(id);
  job.status = 'running';

  const steps = ['frame', 'retrieve', 'reason', 'stop'];
  while (job.step < steps.length && job.step < job.budget) {
    const name = steps[job.step];
    if (name === 'stop') {
      job.status = 'done';
      job.log.push({ step: name, exit: 'budget-or-terminal' });
      job.step += 1;
      break;
    }
    if (name === 'retrieve') {
      const retrieved = asData('example retrieved document');
      job.log.push({ step: name, data: retrieved });
    } else {
      const out = await complete({ goal: job.goal, step: name });
      job.log.push({ step: name, out });
    }
    job.step += 1;
  }

  if (job.status !== 'done') {
    job.status = job.step >= job.budget ? 'stopped_budget' : 'done';
  }
  return job;
}
