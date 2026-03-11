import { mock } from 'bun:test';

const noop = () => {};

global.console.log = noop;
global.console.info = noop;
global.console.warn = noop;
global.console.debug = noop;

mock.module('../config', () => ({
  config: {
    server: { port: 9999, debug: false, autoupdate: false },
    http: { maxFiles: 40, maxFileSize: 100 },
    mediasoup: {
      worker: { rtcMinPort: 40000, rtcMaxPort: 40020 },
      audio: { maxBitrate: 510000, stereo: true, fec: true, dtx: true },
      video: { initialAvailableOutgoingBitrate: 6000000 }
    },
    federation: { enabled: false, domain: '' },
    voice: { backend: 'mediasoup' }
  },
  SERVER_PUBLIC_IP: '127.0.0.1',
  SERVER_PRIVATE_IP: '127.0.0.1'
}));

mock.module('../logger', () => ({
  logger: {
    info: noop,
    warn: noop,
    error: noop,
    debug: noop,
    trace: noop,
    fatal: noop,
    time: noop,
    timeEnd: noop
  }
}));

mock.module('../http/rate-limit', () => ({
  checkRateLimit: () => true,
  authRateLimit: { windowMs: 900000, maxRequests: Infinity },
  federationRateLimit: { windowMs: 60000, maxRequests: Infinity }
}));

declare global {
  // eslint-disable-next-line no-var
  var __registrationDisabled: boolean;
}

mock.module('../utils/env', () => ({
  isRegistrationDisabled: () => globalThis.__registrationDisabled ?? false,
  SERVER_VERSION: '0.0.0-dev',
  BUILD_DATE: 'dev',
  IS_PRODUCTION: false,
  IS_DEVELOPMENT: true,
  IS_TEST: true,
  IS_DOCKER: false,
  PULSE_MEDIASOUP_BIN_NAME: undefined
}));
