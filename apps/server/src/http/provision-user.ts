import http from 'http';

const provisionRouteHandler = async (
  _req: http.IncomingMessage,
  res: http.ServerResponse
) => {
  res.writeHead(410, { 'Content-Type': 'application/json' });
  res.end(
    JSON.stringify({
      error: 'OAuth provisioning is not available. Use /register or /login.'
    })
  );
};

export { provisionRouteHandler };
