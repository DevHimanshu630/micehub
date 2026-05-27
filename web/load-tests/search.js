// Public search load test. Mimics step 13 target of "1000 concurrent
// searches" by ramping up to 100 VUs over 1 minute, holding for 2, ramping
// down over 30s. Adjust `stages` if you have a beefier load box.
//
//   k6 run -e BASE_URL=https://your-preview.vercel.app load-tests/search.js
//
import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

// Static city list — keep it short so the cache hit rate matches reality.
const CITIES = ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai"];

export const options = {
  stages: [
    { duration: "1m", target: 100 },
    { duration: "2m", target: 100 },
    { duration: "30s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.02"],
    http_req_duration: ["p(95)<2000", "p(99)<4000"],
  },
};

export default function search() {
  // 70% browse all, 30% filter by a random city.
  const city =
    Math.random() < 0.3
      ? CITIES[Math.floor(Math.random() * CITIES.length)]
      : null;
  const url = city
    ? `${BASE_URL}/venues?city=${encodeURIComponent(city)}`
    : `${BASE_URL}/venues`;

  const res = http.get(url, { tags: { name: "venues" } });
  check(res, {
    "status is 200": (r) => r.status === 200,
  });

  sleep(Math.random() * 2);
}
