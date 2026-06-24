// Minimal no-op @opentelemetry/api stand-in. We don't ship OpenTelemetry, but Better
// Auth calls api.trace.getTracer(...).startActiveSpan(...) for tracing. Metro rethrows a
// throwing module synchronously (escaping Better Auth's .catch), so instead provide a
// working no-op that satisfies those calls and does nothing.
const noopSpan = {
  end() {},
  setStatus() { return this; },
  setAttribute() { return this; },
  setAttributes() { return this; },
  recordException() {},
  addEvent() { return this; },
  updateName() { return this; },
  isRecording() { return false; },
  spanContext() { return { traceId: "", spanId: "", traceFlags: 0 }; },
};
const noopTracer = {
  startActiveSpan(_name, arg2, arg3, arg4) {
    const cb = typeof arg2 === "function" ? arg2 : typeof arg3 === "function" ? arg3 : arg4;
    return typeof cb === "function" ? cb(noopSpan) : undefined;
  },
  startSpan() { return noopSpan; },
};
const trace = {
  getTracer() { return noopTracer; },
  getActiveSpan() { return undefined; },
  getSpan() { return undefined; },
  setSpan(ctx) { return ctx; },
  deleteSpan(ctx) { return ctx; },
  wrapSpanContext() { return noopSpan; },
};
const context = {
  active() { return {}; },
  with(_ctx, fn, thisArg, ...args) { return fn.call(thisArg, ...args); },
  bind(_ctx, target) { return target; },
};
module.exports = {
  trace,
  context,
  SpanStatusCode: { UNSET: 0, OK: 1, ERROR: 2 },
  SpanKind: { INTERNAL: 0, SERVER: 1, CLIENT: 2, PRODUCER: 3, CONSUMER: 4 },
  ValueType: { INT: 0, DOUBLE: 1 },
  default: {},
};
