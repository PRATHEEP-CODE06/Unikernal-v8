// tests/nightmare-matrix.js
// "Developer Nightmare" cross-language matrix test over Unikernal v8
// All routes go through real v8 kernel + echo-service.
// We simulate impossible language pairs via UDL payload + source labels.

const WebSocket = require('ws');

const WS_URL = 'ws://localhost:3000/ws';

const PAIRS = [
  { from: 'C',         to: 'Rust' },
  { from: 'Rust',      to: 'C' },
  { from: 'Go',        to: 'PHP' },
  { from: 'PHP',       to: 'Python' },
  { from: 'R',         to: 'Java' },
  { from: 'Lua',       to: 'Koka' },      // nightmare, weird combo
  { from: 'Kotlin',    to: 'C#' },
  { from: 'Java',      to: 'Matlab' },
  { from: 'Node',      to: 'Haskell' },
  { from: 'Bash',      to: 'Typescript' },
];

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
  console.log('=== Unikernal v8 Nightmare Matrix Test ===');
  console.log('Simulating cross-language calls via echo-service...\n');

  const results = [];

  for (const pair of PAIRS) {
    const label = `${pair.from}→${pair.to}`;
    const traceId = `nm-${pair.from.toLowerCase()}-${pair.to.toLowerCase()}-${Date.now()}`;


    const envelope = {
      version: '8.0',
      source: `${pair.from.toLowerCase()}-client`,
      target: 'echo-service',
      intent: 'invoke',
      meta: {
        timestamp: new Date().toISOString(),
        trace_id: traceId,
      },
      payload: {
        from_language: pair.from,
        to_language: pair.to,
        scenario: 'developer-nightmare-cross-language-test',
        note: `Simulated ${pair.from} → ${pair.to} call via Unikernal v8`,
      },
    };

    try {
      const reply = await sendEnvelope(label, envelope);
      assertEchoResponse(label, reply, traceId);
      console.log(`\n✅ ${label}: Routed successfully through Unikernal v8.`);
      results.push({ pair: label, status: 'PASS' });
    } catch (err) {
      console.error(`\n❌ ${label}: FAILED - ${err.message || err}`);
      results.push({ pair: label, status: 'FAIL', error: err.message || String(err) });
    }
  }

  console.log('\n==================== NIGHTMARE MATRIX SUMMARY ====================');
  let passed = 0;
  let failed = 0;
  for (const r of results) {
    if (r.status === 'PASS') {
      console.log(`✅ ${r.pair}`);
      passed++;
    } else {
      console.log(`❌ ${r.pair} — ${r.error}`);
      failed++;
    }
  }
  console.log('=================================================================');
  console.log(`Total: ${results.length}, Passed: ${passed}, Failed: ${failed}`);

  if (failed === 0) {
    console.log('\n🎉 ALL GOOD: Nightmare Matrix fully passed. Unikernal v8 routed every impossible pair successfully.');
    process.exit(0);
  } else {
    console.log('\n⚠ Some nightmare routes failed. Check the errors above.');
    process.exit(1);
  }
})();
