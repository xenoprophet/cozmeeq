import { config } from '../config';
import { logger } from '../logger';

const getVoiceBackend = () => config.voice.backend;

const assertSupportedVoiceBackend = () => {
  if (config.voice.backend === 'livekit') {
    throw new Error(
      'Voice backend "livekit" is not fully wired yet. Current runtime remains mediasoup while migration is in progress.'
    );
  }

  logger.info('Voice backend: %s', config.voice.backend);
};

export { assertSupportedVoiceBackend, getVoiceBackend };
