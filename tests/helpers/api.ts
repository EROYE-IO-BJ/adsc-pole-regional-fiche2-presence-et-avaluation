import { NextRequest } from "next/server";

export function createRequest(
  method: string,
  path: string,
  options?: { body?: unknown; searchParams?: Record<string, string> }
): NextRequest {
  const url = new URL(path, "http://localhost:3000");
  if (options?.searchParams) {
    for (const [key, value] of Object.entries(options.searchParams)) {
      url.searchParams.set(key, value);
    }
  }

  const init: RequestInit = { method };
  if (options?.body) {
    init.body = JSON.stringify(options.body);
    init.headers = { "Content-Type": "application/json" };
  }

  return new NextRequest(url, init as any);
}

export function createParams(
  params: Record<string, string>
): { params: Promise<any> } {
  return { params: Promise.resolve(params) };
}

export async function parseResponse(res: Response) {
  const status = res.status;
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("text/csv")) {
    return { status, data: await res.text() };
  }
  try {
    const data = await res.json();
    return { status, data };
  } catch {
    return { status, data: await res.text() };
  }
}
