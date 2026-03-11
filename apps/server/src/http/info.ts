import type { TServerInfo } from '@pulse/shared';
import http from 'http';
import { getFirstServer } from '../db/queries/servers';
import { isRegistrationDisabled, SERVER_VERSION } from '../utils/env';

const infoRouteHandler = async (
  req: http.IncomingMessage,
  res: http.ServerResponse
) => {
  const server = await getFirstServer();

  if (!server) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'No server found' }));
    return;
  }

  const info: TServerInfo = {
    serverId: server.publicId,
    version: SERVER_VERSION,
    name: server.name,
    description: server.description,
    logo: server.logo,
    allowNewUsers: server.allowNewUsers,
    registrationDisabled: isRegistrationDisabled(),
    enabledAuthProviders: [],
    giphyApiKey: process.env.GIPHY_API_KEY || undefined
  };

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(info));
};

export { infoRouteHandler };
