/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../../src/pages/api/file';

const mockBucket = {
  get: vi.fn(),
};

function makeMockContext(bucket: any = mockBucket) {
  return {
    locals: {
      runtime: {
        env: {
          CYGNUS_BUCKET: bucket,
        },
      },
    },
  };
}

describe('GET /api/file', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 500 when CYGNUS_BUCKET binding is missing', async () => {
    const ctx = { locals: { runtime: { env: {} } } };
    const url = new URL('http://localhost/api/file?key=audio/test.mp3');
    const resp = await GET({ ...ctx, url } as any);
    expect(resp.status).toBe(500);
    const body = (await resp.json()) as { message: string };
    expect(body.message).toContain('Server configuration error');
  });

  it('returns 400 when key parameter is missing', async () => {
    const ctx = makeMockContext();
    const url = new URL('http://localhost/api/file');
    const resp = await GET({ ...ctx, url } as any);
    expect(resp.status).toBe(400);
    const body = (await resp.json()) as { message: string };
    expect(body.message).toBe('Key parameter is required');
  });

  it('returns 400 for invalid key prefix', async () => {
    const ctx = makeMockContext();
    const url = new URL('http://localhost/api/file?key=invalid/test.mp3');
    const resp = await GET({ ...ctx, url } as any);
    expect(resp.status).toBe(400);
    const body = (await resp.json()) as { message: string };
    expect(body.message).toBe('Invalid key');
  });

  it('returns 400 for path traversal attempt', async () => {
    const ctx = makeMockContext();
    const url = new URL('http://localhost/api/file?key=audio/../etc/passwd');
    const resp = await GET({ ...ctx, url } as any);
    expect(resp.status).toBe(400);
    const body = (await resp.json()) as { message: string };
    expect(body.message).toBe('Invalid key');
  });

  it('returns 415 for unsupported file extension', async () => {
    const ctx = makeMockContext();
    const url = new URL('http://localhost/api/file?key=audio/test.ogg');
    const resp = await GET({ ...ctx, url } as any);
    expect(resp.status).toBe(415);
    const body = (await resp.json()) as { message: string };
    expect(body.message).toBe('Unsupported file type');
  });

  it('returns 415 for SVG files (security)', async () => {
    const ctx = makeMockContext();
    const url = new URL('http://localhost/api/file?key=preview/test.svg');
    const resp = await GET({ ...ctx, url } as any);
    expect(resp.status).toBe(415);
    const body = (await resp.json()) as { message: string };
    expect(body.message).toBe('Unsupported file type');
  });

  it('returns 404 when file not found in R2', async () => {
    mockBucket.get.mockResolvedValue(null);
    const ctx = makeMockContext();
    const url = new URL('http://localhost/api/file?key=audio/test.mp3');
    const resp = await GET({ ...ctx, url } as any);
    expect(resp.status).toBe(404);
    const body = (await resp.json()) as { message: string };
    expect(body.message).toBe('File not found');
    expect(mockBucket.get).toHaveBeenCalledWith('audio/test.mp3');
  });

  it('returns 200 with correct Content-Type for MP3 audio', async () => {
    const mockObject = {
      body: new ReadableStream(),
      httpMetadata: {},
    };
    mockBucket.get.mockResolvedValue(mockObject);
    const ctx = makeMockContext();
    const url = new URL('http://localhost/api/file?key=audio/test.mp3');
    const resp = await GET({ ...ctx, url } as any);
    expect(resp.status).toBe(200);
    expect(resp.headers.get('Content-Type')).toBe('audio/mpeg');
    expect(resp.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });

  it('returns 200 with correct Content-Type for WAV audio', async () => {
    const mockObject = {
      body: new ReadableStream(),
      httpMetadata: {},
    };
    mockBucket.get.mockResolvedValue(mockObject);
    const ctx = makeMockContext();
    const url = new URL('http://localhost/api/file?key=audio/test.wav');
    const resp = await GET({ ...ctx, url } as any);
    expect(resp.status).toBe(200);
    expect(resp.headers.get('Content-Type')).toBe('audio/wav');
  });

  it('returns 200 with correct Content-Type for PNG preview', async () => {
    const mockObject = {
      body: new ReadableStream(),
      httpMetadata: {},
    };
    mockBucket.get.mockResolvedValue(mockObject);
    const ctx = makeMockContext();
    const url = new URL('http://localhost/api/file?key=preview/test.png');
    const resp = await GET({ ...ctx, url } as any);
    expect(resp.status).toBe(200);
    expect(resp.headers.get('Content-Type')).toBe('image/png');
  });

  it('returns 200 with correct Content-Type for JPEG preview', async () => {
    const mockObject = {
      body: new ReadableStream(),
      httpMetadata: {},
    };
    mockBucket.get.mockResolvedValue(mockObject);
    const ctx = makeMockContext();
    const url = new URL('http://localhost/api/file?key=preview/test.jpg');
    const resp = await GET({ ...ctx, url } as any);
    expect(resp.status).toBe(200);
    expect(resp.headers.get('Content-Type')).toBe('image/jpeg');
  });

  it('sets Cache-Control header for successful responses', async () => {
    const mockObject = {
      body: new ReadableStream(),
      httpMetadata: {},
    };
    mockBucket.get.mockResolvedValue(mockObject);
    const ctx = makeMockContext();
    const url = new URL('http://localhost/api/file?key=audio/test.mp3');
    const resp = await GET({ ...ctx, url } as any);
    expect(resp.status).toBe(200);
    expect(resp.headers.get('Cache-Control')).toBe('public, max-age=86400');
  });

  it('handles case-insensitive key matching', async () => {
    const mockObject = {
      body: new ReadableStream(),
      httpMetadata: {},
    };
    mockBucket.get.mockResolvedValue(mockObject);
    const ctx = makeMockContext();
    const url = new URL('http://localhost/api/file?key=AUDIO/TEST.MP3');
    const resp = await GET({ ...ctx, url } as any);
    expect(resp.status).toBe(200);
    expect(resp.headers.get('Content-Type')).toBe('audio/mpeg');
  });

  it('returns 500 on unexpected errors', async () => {
    mockBucket.get.mockRejectedValue(new Error('R2 error'));
    const ctx = makeMockContext();
    const url = new URL('http://localhost/api/file?key=audio/test.mp3');
    const resp = await GET({ ...ctx, url } as any);
    expect(resp.status).toBe(500);
    const body = (await resp.json()) as { message: string };
    expect(body.message).toBe('Internal Server Error');
  });
});
