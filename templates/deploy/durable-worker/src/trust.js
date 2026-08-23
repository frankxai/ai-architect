// Tool and retrieval text enters the window as labelled data, never as
// an instruction. The shape is the trust boundary.

export function asData(text) {
  return {
    kind: 'data',
    text: String(text),
  };
}

export function isInstructionPosition(message) {
  return message && message.role === 'system';
}

export function assertNotInstruction(payload) {
  if (payload && payload.kind === 'data' && isInstructionPosition(payload)) {
    throw new Error('untrusted data cannot sit in the instruction position');
  }
  return payload;
}
