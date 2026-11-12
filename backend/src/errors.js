export class UpstreamError extends Error {
  constructor(service, detail) {
    super(`${service} falló: ${detail}`);
    this.name = 'UpstreamError';
    this.service = service;
  }
}