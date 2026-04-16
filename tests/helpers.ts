import { NextRequest } from "next/server";
import { setTestAccessToken } from "./setup";

type Handler = (req: NextRequest, ctx: { params: Promise<Record<string, string>> }) => Promise<Response>;

interface CallOpts {
  token: string | null;
  params?: Record<string, string>;
  body?: unknown;
  query?: Record<string, string>;
  method?: string;
}

export async function callRoute(handler: Handler, opts: CallOpts): Promise<Response> {
  setTestAccessToken(opts.token);
  const method = opts.method ?? "GET";
  const url = new URL("http://test.local/route");
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) url.searchParams.set(k, v);
  }
  const init: { method: string; body?: string; headers?: Record<string, string> } = { method };
  if (opts.body !== undefined) {
    init.body = JSON.stringify(opts.body);
    init.headers = { "content-type": "application/json" };
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const req = new NextRequest(url, init as any);
  const params = Promise.resolve(opts.params ?? {});
  try {
    return await handler(req, { params });
  } finally {
    setTestAccessToken(null);
  }
}

export async function expectStatus(res: Response, expected: number | number[]) {
  const allowed = Array.isArray(expected) ? expected : [expected];
  if (!allowed.includes(res.status)) {
    const body = await res.text();
    throw new Error(`expected status ${allowed.join("|")}, got ${res.status}: ${body}`);
  }
}
