// tests/haskell-matlab-nightmare.js
// Simulated "nightmare" cross-language test: Haskell ↔ Matlab via Unikernal v8
// Uses the real v8 kernel, UDL/UDM, WebSocket, and echo-service.

const WebSocket = require('ws');

const WS_URL = 'ws://localhost:3000/ws';

function sendEnvelope(label, envelope) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL);
    let replied = false;

    ws.on('open', () => {
      console.log(`\n[${label}] Connected to Kernel ✅`);
      console.log(`[${label}] Sending envelope:`);
      console.log(JSON.stringify(envelope, null, 2));
      ws.send(JSON.stringify(envelope));
    });

    ws.on('message', (data) => {
      replied = true;
      let msg;
      try {
        msg = JSON.parse(data.toString());
      } catch (e) {
        console.error(`[${label}] FAIL: Invalid JSON response`, e);
        ws.close();
        return reject(e);
      }

      console.log(`\n[${label}] Received reply:`);
      console.log(JSON.stringify(msg, null, 2));
      ws.close();
      resolve(msg);
    });

    ws.on('error', (err) => {
      console.error(`[${label}] WebSocket error:`, err);
      reject(err);
    });

    ws.on('close', () => {
      if (!replied) {
        console.error(`[${label}] Connection closed before reply`);
        reject(new Error('No reply from kernel'));
      }
    });
  });
}

function assertEchoResponse(label, reply, expectedTraceId) {
  const payload = reply && reply.payload;
  if (!payload) {
    throw new Error(`[${label}] Missing payload in reply`);
  }
  if (reply.version !== '8.0') {
    throw new Error(`[${label}] Expected version 8.0, got ${reply.version}`);
  }
  if (reply.source !== 'kernel') {
    throw new Error(
      `[${label}] Expected source "kernel", got ${reply.source}`
    );
  }
  if (reply.intent !== 'response') {
    throw new Error(
      `[${label}] Expected intent "response", got ${reply.intent}`
    );
  }
  if (payload.status !== 'ok') {
    throw new Error(
      `[${label}] Expected status "ok", got ${payload.status}`
    );
  }
  if (payload.service !== 'echo-service') {
    throw new Error(
      `[${label}] Expected service "echo-service", got ${payload.service}`
    );
  }
  if (payload.trace_id !== expectedTraceId) {
    throw new Error(
      `[${label}] Expected trace_id "${expectedTraceId}", got ${payload.trace_id}`
    );
  }
}

(async () => {
  try {
    console.log('=== Unikernal v8 Nightmare Test: Haskell ↔ Matlab ===');

    // 1) "Haskell" sends analytics job to "Matlab" (via echo-service)
    const traceHaskellToMatlab = 'hs-ml-test-1';
    const haskellEnvelope = {
      version: '8.0',
      source: 'haskell-analytics-client',
      target: 'echo-service', // conceptually "matlab-signal-service"
      intent: 'invoke',
      meta: {
        timestamp: new Date().toISOString(),
        trace_id: traceHaskellToMatlab,
      },
      payload: {
        role: 'haskell',
        operation: 'fft_analyze',
        data: [1, 2, 3, 4, 5],
        note: 'Simulated Haskell → Matlab call via Unikernal v8',
      },
    };

    const reply1 = await sendEnvelope('HASKELL→MATLAB', haskellEnvelope);
    assertEchoResponse('HASKELL→MATLAB', reply1, traceHaskellToMatlab);
    console.log(
      '\n✅ SUCCESS: Simulated Haskell → Matlab call routed correctly through Unikernal v8.'
    );

    // 2) "Matlab" responds back to "Haskell" (also via echo-service)
    const traceMatlabToHaskell = 'ml-hs-test-1';
    const matlabEnvelope = {
      version: '8.0',
      source: 'matlab-signal-client',
      target: 'echo-service', // conceptually sending back to Haskell via kernel
      intent: 'invoke',
      meta: {
        timestamp: new Date().toISOString(),
        trace_id: traceMatlabToHaskell,
      },
      payload: {
        role: 'matlab',
        operation: 'fft_result',
        spectrum: [10.2, 5.1, 1.7],
        note: 'Simulated Matlab → Haskell reply via Unikernal v8',
      },
    };

    const reply2 = await sendEnvelope('MATLAB→HASKELL', matlabEnvelope);
    assertEchoResponse('MATLAB→HASKELL', reply2, traceMatlabToHaskell);
    console.log(
      '\n✅ SUCCESS: Simulated Matlab → Haskell reply routed correctly through Unikernal v8.'
    );

    console.log(
      '\n🎉 ALL GOOD: "Developer Nightmare" Haskell ↔ Matlab messaging works over Unikernal v8 (simulated via echo-service).'
    );
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Nightmare test FAILED:', err.message || err);
    process.exit(1);
  }
})();
