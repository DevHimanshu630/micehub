// Smoke test: 1 virtual user, 1 iteration. Confirms the public landing +
// venue listing pages render under load-test conditions. Run before any of the
// heavier scripts to catch typos / wrong BASE_URL early.
//
//   k6 run -e BASE_URL=http://localhost:3000 load-tests/smoke.js
//
import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<1500"],
  },
};

export default function smoke() {
  const landing = http.get(`${BASE_URL}/`);
  check(landing, {
    "landing 200": (r) => r.status === 200,
  });

  const venues = http.get(`${BASE_URL}/venues`);
  check(venues, {
    "venues 200": (r) => r.status === 200,
    "venues html": (r) =>
      typeof r.body === "string" && r.body.includes("<html"),
  });

  sleep(1);
}
