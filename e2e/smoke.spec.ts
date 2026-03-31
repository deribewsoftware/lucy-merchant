import { expect, test } from "@playwright/test";

test("GET /api/health returns ok", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.ok()).toBeTruthy();
  const body = (await res.json()) as { ok?: boolean; service?: string };
  expect(body).toMatchObject({ ok: true, service: "lucy-merchant" });
});

test("GET / returns HTML with app title (SSR smoke)", async ({ request }) => {
  const res = await request.get("/");
  expect(res.ok()).toBeTruthy();
  const ct = res.headers()["content-type"] ?? "";
  expect(ct).toMatch(/text\/html/i);
  const html = await res.text();
  expect(html).toMatch(/Lucy Merchant/);
});

test("POST /api/presence without session returns 401", async ({
  request,
}) => {
  const res = await request.post("/api/presence");
  expect(res.status()).toBe(401);
});
