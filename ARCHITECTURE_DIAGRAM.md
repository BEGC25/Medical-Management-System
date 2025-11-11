# Payments Clinic Day Architecture

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT (React)                          │
│                                                             │
│  Payment.tsx Component                                      │
│  ┌───────────────────────────────────────────────────┐    │
│  │  useQuery({                                        │    │
│  │    queryKey: ['/api/payments', {preset: 'today'}] │    │
│  │    queryFn: fetch('/api/payments?preset=today')   │    │
│  │  })                                                │    │
│  └───────────────────────────────────────────────────┘    │
│                           │                                 │
│                           ▼                                 │
└───────────────────────────┼─────────────────────────────────┘
                            │
                            │ HTTP GET
                            │ ?preset=today
                            │
┌───────────────────────────┼─────────────────────────────────┐
│                  SERVER (Express.js)                        │
│                           ▼                                 │
│  /api/payments Route Handler                                │
│  ┌───────────────────────────────────────────────────┐    │
│  │  1. Parse query params                             │    │
│  │     - preset, from, to (new)                       │    │
│  │     - date, today (legacy)                         │    │
│  │                                                     │    │
│  │  2. Convert to day keys                            │    │
│  │     getPresetDayKeys('today')                      │    │
│  │     → { startKey: '2025-11-10',                    │    │
│  │         endKey: '2025-11-10' }                     │    │
│  │                                                     │    │
│  │  3. Call storage layer                             │    │
│  │     storage.getPayments(startKey, endKey)          │    │
│  │                                                     │    │
│  │  4. Enrich with patient/service data               │    │
│  │                                                     │    │
│  │  5. Return JSON                                    │    │
│  └───────────────────────────────────────────────────┘    │
│                           │                                 │
└───────────────────────────┼─────────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────┐
│               STORAGE LAYER (storage.ts)                  │
│                                                           │
│  getPayments(startKey?, endKey?)                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  if (startKey && endKey) {                       │    │
│  │    db.select().from(payments)                    │    │
│  │      .where(                                     │    │
│  │        and(                                      │    │
│  │          gte(payments.clinicDay, startKey),     │    │
│  │          lte(payments.clinicDay, endKey)        │    │
│  │        )                                         │    │
│  │      )                                           │    │
│  │  }                                               │    │
│  └─────────────────────────────────────────────────┘    │
│                           │                               │
└───────────────────────────┼───────────────────────────────┘
                            │
                            ▼
┌───────────────────────────────────────────────────────────┐
│            DATABASE (PostgreSQL/Neon)                     │
│                                                           │
│  payments table                                          │
│  ┌─────────────────────────────────────────────────┐    │
│  │  id              SERIAL                          │    │
│  │  payment_id      TEXT                            │    │
│  │  patient_id      TEXT                            │    │
│  │  total_amount    REAL                            │    │
│  │  payment_method  TEXT                            │    │
│  │  payment_date    TEXT                            │    │
│  │  received_by     TEXT                            │    │
│  │  notes           TEXT                            │    │
│  │  clinic_day      DATE  ◄── NEW COLUMN            │    │
│  │  created_at      TEXT                            │    │
│  │                                                   │    │
│  │  INDEX: idx_payments_clinic_day ON clinic_day    │    │
│  └─────────────────────────────────────────────────┘    │
│                                                           │
│  Query Execution:                                        │
│  SELECT * FROM payments                                  │
│  WHERE clinic_day >= '2025-11-10'                       │
│    AND clinic_day <= '2025-11-10'                       │
│  ▲ Uses index for fast filtering                        │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

## Preset Resolution Flow

```
User Action: Click "Today's Payments" tab
    │
    ▼
┌─────────────────────────────────────┐
│ React Query Key                     │
│ ['/api/payments', {preset: 'today'}]│
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ HTTP Request                        │
│ GET /api/payments?preset=today      │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────┐
│ Server: Parse Preset                        │
│ getPresetDayKeys('today')                   │
│   ├─ Get current UTC time: 2025-11-10 21:00│
│   ├─ Convert to Africa/Juba: 23:00          │
│   └─ Extract date: 2025-11-10               │
└─────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Day Keys                            │
│ startKey: '2025-11-10'              │
│ endKey: '2025-11-10'                │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ SQL Query                           │
│ WHERE clinic_day BETWEEN            │
│   '2025-11-10' AND '2025-11-10'     │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Database Returns Rows               │
│ ├─ Payment 1 (clinic_day: 2025-11-10)│
│ ├─ Payment 2 (clinic_day: 2025-11-10)│
│ └─ Payment 3 (clinic_day: 2025-11-10)│
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Enrich with Patient/Service Data   │
│ ├─ Load patients                   │
│ ├─ Load services                   │
│ └─ Join payment_items              │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Return JSON Response                │
│ [{                                  │
│   paymentId: "PAY-123",            │
│   patient: {...},                   │
│   items: [...],                     │
│   breakdown: {...}                  │
│ }]                                  │
└─────────────────────────────────────┘
```

## Preset Mapping

| Preset      | Description           | Start Key          | End Key            |
|-------------|-----------------------|--------------------|--------------------|
| `today`     | Current clinic day    | 2025-11-10        | 2025-11-10        |
| `yesterday` | Previous clinic day   | 2025-11-09        | 2025-11-09        |
| `last7`     | Last 7 days inclusive | 2025-11-04        | 2025-11-10        |
| `last30`    | Last 30 days inclusive| 2025-10-12        | 2025-11-10        |

All dates computed in **Africa/Juba timezone (UTC+2)**

## Legacy Parameter Support

```
┌────────────────────────────┐
│ Legacy: ?date=2025-11-10   │
└────────────────────────────┘
          │
          ▼
┌────────────────────────────┐
│ Log deprecation warning    │
│ Convert to day range       │
│ startKey: 2025-11-10       │
│ endKey: 2025-11-10         │
└────────────────────────────┘
          │
          ▼
┌────────────────────────────┐
│ Same SQL query as preset   │
└────────────────────────────┘

┌────────────────────────────┐
│ Legacy: ?today=1           │
└────────────────────────────┘
          │
          ▼
┌────────────────────────────┐
│ Log deprecation warning    │
│ Convert to preset=today    │
└────────────────────────────┘
          │
          ▼
┌────────────────────────────┐
│ Use preset resolution      │
└────────────────────────────┘
```

## Payment Creation Flow

```
User creates payment
    │
    ▼
┌─────────────────────────────────────┐
│ POST /api/payments                  │
│ Body: {                             │
│   patientId: "...",                 │
│   items: [...],                     │
│   paymentMethod: "cash",            │
│   receivedBy: "..."                 │
│ }                                   │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ storage.createPayment()             │
│ ├─ Generate paymentId               │
│ ├─ Get current timestamp            │
│ ├─ Calculate clinic_day             │
│ │  getClinicDayKey()                │
│ │  → '2025-11-10'                   │
│ └─ Insert into database             │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ Database Insert                     │
│ INSERT INTO payments (              │
│   payment_id,                       │
│   patient_id,                       │
│   total_amount,                     │
│   payment_method,                   │
│   payment_date,                     │
│   received_by,                      │
│   clinic_day,        ◄── AUTO SET   │
│   created_at                        │
│ ) VALUES (...)                      │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ React Query Cache Invalidation      │
│ queryClient.invalidateQueries({     │
│   queryKey: ['/api/payments']       │
│ })                                  │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ UI Updates Automatically            │
│ "Today's Payments" shows new payment│
└─────────────────────────────────────┘
```

## Timezone Handling

```
UTC Time:           2025-11-10T21:00:00Z
                           │
                           ▼
Africa/Juba (UTC+2): 2025-11-10T23:00:00+02:00
                           │
                           ▼
Clinic Day Key:          2025-11-10
                           │
                           ▼
Stored in Database:     clinic_day = '2025-11-10'
                           │
                           ▼
Query Filter:           WHERE clinic_day = '2025-11-10'
```

## Index Usage

```sql
-- Efficient Query (Uses Index)
EXPLAIN ANALYZE
SELECT * FROM payments
WHERE clinic_day = '2025-11-10';

-- Result:
Index Scan using idx_payments_clinic_day on payments
  Index Cond: (clinic_day = '2025-11-10'::date)
  Planning Time: 0.123 ms
  Execution Time: 0.456 ms
```

## Backward Compatibility

```
Old Client (using date=)
    │
    ▼
┌──────────────────────────┐
│ GET ?date=2025-11-10     │
└──────────────────────────┘
    │
    ▼ (Server handles both)
┌──────────────────────────┐
│ Deprecation warning      │
│ Convert to day keys      │
│ Same SQL query           │
└──────────────────────────┘
    │
    ▼
┌──────────────────────────┐
│ Returns correct data     │
└──────────────────────────┘

New Client (using preset=)
    │
    ▼
┌──────────────────────────┐
│ GET ?preset=today        │
└──────────────────────────┘
    │
    ▼
┌──────────────────────────┐
│ Parse preset             │
│ Convert to day keys      │
│ Same SQL query           │
└──────────────────────────┘
    │
    ▼
┌──────────────────────────┐
│ Returns correct data     │
└──────────────────────────┘
```
