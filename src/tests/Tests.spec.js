import { htmlReport } from 'https://raw.githubusercontent.com/benc-uk/k6-reporter/latest/dist/bundle.js';
import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.1/index.js';
import http from 'k6/http';
import { check } from 'k6';
import { Trend, Rate } from 'k6/metrics';

export const getDurationTrend = new Trend('get_duration', true);
export const statusOKRate = new Rate('status_ok'); // nome da métrica atualizado

export const options = {
  thresholds: {
    http_req_failed: ['rate<0.25'], // < 25% erro
    http_req_duration: ['p(99)<6800'], // 99% < 6800ms
    get_duration: ['p(95)<6800'], // trend
    status_ok: ['rate>0.75'] // métrica RATE corrigida
  },
  stages: [
    { duration: '30s', target: 5 },
    { duration: '30s', target: 20 },
    { duration: '60s', target: 50 },
    { duration: '90s', target: 92 }
  ]
};

export function handleSummary(data) {
  return {
    './src/output/index.html': htmlReport(data),
    stdout: textSummary(data, { indent: ' ', enableColors: true })
  };
}

export default function () {
  const baseUrl = 'https://jsonplaceholder.typicode.com/posts';

  const params = {
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const OK = 200;

  const res = http.get(`${baseUrl}`, params);

  getDurationTrend.add(res.timings.duration);

  statusOKRate.add(res.status === OK); // métrica RATE correta

  check(res, {
    'GET Status 200': () => res.status === OK
  });
}
