import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';


const BASE_URL         = __ENV.BASE_URL         || 'http://localhost:3000';
const ITEMS_ENDPOINT   = `${BASE_URL}/items`;
const THINK_TIME_SEC   = Number(__ENV.THINK_TIME_SEC) || 0.5;
const REQUEST_TIMEOUT  = __ENV.REQUEST_TIMEOUT  || '30s';

const JSON_HEADERS = {
  headers: { 'Content-Type': 'application/json' },
  timeout: REQUEST_TIMEOUT,
};

export const options = {
  stages: [
    { duration: '10s', target: 100 }, // warm-up
    { duration: '10s', target: 500 }, // ramp to peak
    { duration: '30s', target: 500 }, // sustain peak
    { duration: '10s', target: 0   }, // cool-down
  ],
  thresholds: {
    http_req_duration:  ['p(95)<500'],  // 95% of requests under 500ms
    'error_rate':       ['rate<0.05'],  // fewer than 5% failed requests
    'checks':           ['rate>0.95'],  // at least 95% of checks pass
  },
};

const createLatency  = new Trend('create_latency', true);
const listLatency    = new Trend('list_latency',   true);
const readOneLatency = new Trend('read_one_latency', true);
const updateLatency  = new Trend('update_latency', true);
const deleteLatency  = new Trend('delete_latency', true);

const errorRate      = new Rate('error_rate');
const itemsCreated   = new Counter('items_created');


function trackErrors(response) {
  errorRate.add(!response || response.status >= 400);
}

function extractItemId(response) {
  try {
    return JSON.parse(response.body).id ?? null;
  } catch (_) {
    return null;
  }
}


function buildItemName() {
  return `item-vu${__VU}-iter${__ITER}`;
}


function createItem() {
  const payload = JSON.stringify({
    name:        buildItemName(),
    description: 'load test item',
  });

  const response = http.post(ITEMS_ENDPOINT, payload, JSON_HEADERS);

  createLatency.add(response.timings.duration);
  check(response, { 'create → 201': (r) => r.status === 201 });
  trackErrors(response);

  if (response.status === 201) itemsCreated.add(1);
  return response;
}

function listItems() {
  const response = http.get(ITEMS_ENDPOINT, { timeout: REQUEST_TIMEOUT });

  listLatency.add(response.timings.duration);
  check(response, { 'list → 200': (r) => r.status === 200 });
  trackErrors(response);
  return response;
}

function readItem(itemId) {
  const response = http.get(`${ITEMS_ENDPOINT}/${itemId}`, { timeout: REQUEST_TIMEOUT });

  readOneLatency.add(response.timings.duration);
  check(response, { 'read-one → 200': (r) => r.status === 200 });
  trackErrors(response);
  return response;
}

function updateItem(itemId) {
  const payload = JSON.stringify({ description: 'updated by load test' });
  const response = http.put(`${ITEMS_ENDPOINT}/${itemId}`, payload, JSON_HEADERS);

  updateLatency.add(response.timings.duration);
  check(response, { 'update → 200': (r) => r.status === 200 });
  trackErrors(response);
  return response;
}

function deleteItem(itemId) {
  const response = http.del(`${ITEMS_ENDPOINT}/${itemId}`, null, { timeout: REQUEST_TIMEOUT });

  deleteLatency.add(response.timings.duration);
  check(response, { 'delete → 200 or 204': (r) => r.status === 200 || r.status === 204 });
  trackErrors(response);
  return response;
}

export default function () {
  const createResponse = createItem();
  listItems();

  const itemId = extractItemId(createResponse);
  if (itemId) {
    readItem(itemId);
    updateItem(itemId);
    deleteItem(itemId);
  }

  sleep(THINK_TIME_SEC);
}
