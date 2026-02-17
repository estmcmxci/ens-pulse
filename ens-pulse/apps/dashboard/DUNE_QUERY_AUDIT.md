# Dune Query SQL Audit — Collected 2026-02-16

## Underlying ENS Tables (Decoded Events)

| Table | Purpose |
|-------|---------|
| `ethereumnameservice_ethereum.ENSRegistry_evt_NewOwner` | Registry ownership events |
| `ethereumnameservice_ethereum.ENSRegistryWithFallback_evt_NewOwner` | Registry ownership (fallback) |
| `ethereumnameservice_ethereum.BaseRegistrarImplementation_evt_NameRegistered` | .eth name registrations with expiry |
| `ethereumnameservice_ethereum.BaseRegistrarImplementation_evt_NameRenewed` | .eth name renewals with expiry |
| `ethereumnameservice_ethereum.ETHRegistrarController_1_evt_NameRegistered` | Registrar v1 events |
| `ethereumnameservice_ethereum.ETHRegistrarController_2_evt_NameRegistered` | Registrar v2 events |
| `ethereumnameservice_ethereum.ETHRegistrarController_3_evt_NameRegistered` | Registrar v3 events |
| `ethereumnameservice_ethereum.ETHRegistrarController_4_evt_NameRegistered` | Registrar v4 events (has baseCost + premium) |
| `ethereumnameservice_ethereum.ETHRegistrarController_5_evt_NameRegistered` | Registrar v5 events (labelhash as label) |
| `ethereumnameservice_ethereum.ETHRegistrarController_1..5_evt_NameRenewed` | Renewal events for each controller version |
| `ethereumnameservice_ethereum.NameWrapper_evt_NameWrapped` | Wrapped names with expiry |
| `ethereumnameservice_ethereum.ENSRegistry_evt_Transfer` | Transfer events |
| `ethereumnameservice_ethereum.ENSRegistryWithFallback_evt_Transfer` | Transfer events (fallback) |
| `prices.usd` | Token prices for USD conversion |

## Key Node Hashes

```
0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae = eth
0x91d1777781884d03a6757a803996e38de2a42967fb37eeaca72729271025a9e2 = addr.reverse
0xa097f6721ce401e757d1223a763fef49b8b5f90bb18567ddb86fd205dff71d34 = reverse
0x0000000000000000000000000000000000000000000000000000000000000000 = root
```

## Key Contract Addresses

```
0xd4416b13d2b3a9abae7acd5d6c2bbdbe25686401 = NameWrapper contract
0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2 = WETH
```

---

## Sub-Query: query_2406277 (ens_view_registries)

```sql
SELECT
  node,
  label,
  bytearray_to_uint256(label) as tokenid,
  min(evt_block_time) AS min_evt_block_time,
  max(evt_block_time) AS max_evt_block_time,
  count(*) as count_ens_registries
FROM (
    SELECT * FROM ethereumnameservice_ethereum.ENSRegistry_evt_NewOwner
    UNION ALL
    SELECT * FROM ethereumnameservice_ethereum.ENSRegistryWithFallback_evt_NewOwner
) r
GROUP BY node, label;
```

## Sub-Query: query_2406565 (ens_view_expirations)

```sql
SELECT
    id, tokenid,
    FROM_UNIXTIME(cast(min(expires) as double)) AS min_expires,
    min(evt_block_time) AS min_evt_block_time,
    FROM_UNIXTIME(cast(max(expires) as double)) AS max_expires,
    max(evt_block_time) AS max_evt_block_time,
    count(*) AS count
FROM (
    SELECT id, id as tokenid, expires, evt_block_time
    FROM ethereumnameservice_ethereum.BaseRegistrarImplementation_evt_NameRegistered
    UNION
    SELECT id, id as tokenid, expires, evt_block_time
    FROM ethereumnameservice_ethereum.BaseRegistrarImplementation_evt_NameRenewed
) AS r
GROUP BY id, tokenid;
```

---

## Query #5768: Total ENS Names Created (returns 1 row)

```sql
SELECT COUNT(*)
FROM (
    -- Active .eth names (unexpired within 90 days)
    SELECT c.tokenid AS ".ETH names registrered"
    FROM query_2406277 AS c
    JOIN query_2406565 AS e ON c.tokenid = e.tokenid
        AND c.node = 0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae /* eth */
    WHERE max_expires > (CURRENT_TIMESTAMP - INTERVAL '90' day)
    UNION ALL
    -- Non-.eth names (no expiry concept)
    SELECT tokenid
    FROM query_2406277
    WHERE NOT node IN (
        0x0000000000000000000000000000000000000000000000000000000000000000, /* root */
        0x91d1777781884d03a6757a803996e38de2a42967fb37eeaca72729271025a9e2, /* addr.reverse */
        0xa097f6721ce401e757d1223a763fef49b8b5f90bb18567ddb86fd205dff71d34, /* reverse */
        0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae  /* eth */
    )
) AS r
```

Result: `_col0 = 1490419`

---

## Query #6491: All ENS Participating Addresses (returns 1 row)

```sql
SELECT COUNT(*)
FROM (
    -- Wrapped name owners (active)
    SELECT owner FROM (
        SELECT name, node, owner
        FROM ethereumnameservice_ethereum.NameWrapper_evt_NameWrapped
        WHERE FROM_UNIXTIME(cast(expiry as double)) > (CURRENT_TIMESTAMP - INTERVAL '90' day)
        GROUP BY name, node, owner
    ) GROUP BY owner
    UNION
    -- .eth name owners (active, excluding NameWrapper contract)
    SELECT owner
    FROM (
        SELECT *
        FROM (
            SELECT node, label, bytearray_to_uint256(label) as tokenid, owner
            FROM (
                SELECT * FROM ethereumnameservice_ethereum.ENSRegistry_evt_NewOwner
                UNION
                SELECT * FROM ethereumnameservice_ethereum.ENSRegistryWithFallback_evt_NewOwner
            ) AS rr
            GROUP BY node, label, owner
        ) AS c
        JOIN query_2406565 AS e ON c.tokenid = e.tokenid
            AND c.node = 0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae /* eth */
            AND owner != 0xd4416b13d2b3a9abae7acd5d6c2bbdbe25686401 /* nameWrapper */
        WHERE max_expires > (CURRENT_TIMESTAMP - INTERVAL '90' day)
    ) AS c1
    GROUP BY owner
    UNION
    -- Non-.eth name owners (excluding NameWrapper, root, reverse)
    SELECT owner
    FROM (
        SELECT node, label, owner
        FROM (
            SELECT * FROM ethereumnameservice_ethereum.ENSRegistry_evt_NewOwner
            UNION
            SELECT * FROM ethereumnameservice_ethereum.ENSRegistryWithFallback_evt_NewOwner
        ) AS rr
        WHERE NOT rr.node IN (
            0x0000000000000000000000000000000000000000000000000000000000000000, /* root */
            0x91d1777781884d03a6757a803996e38de2a42967fb37eeaca72729271025a9e2, /* addr.reverse */
            0xa097f6721ce401e757d1223a763fef49b8b5f90bb18567ddb86fd205dff71d34, /* reverse */
            0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae  /* eth */
        )
        AND owner != 0xd4416b13d2b3a9abae7acd5d6c2bbdbe25686401 /* nameWrapper */
        GROUP BY node, label, owner
    ) AS c2
    GROUP BY owner
) AS owners
```

---

## Query #2101527: Primary Names Set (returns 1 row)

```sql
SELECT COUNT(DISTINCT(label)) AS "Primary names set"
FROM query_2406277
WHERE node = 0x91d1777781884d03a6757a803996e38de2a42967fb37eeaca72729271025a9e2 /* addr.reverse */
```

---

## Query #5676: Monthly .eth Registrations (returns ~81 rows)

```sql
SELECT DATE_TRUNC('month', evt_block_time), COUNT(*)
FROM (
    SELECT label, name, evt_block_time FROM ethereumnameservice_ethereum.ETHRegistrarController_1_evt_NameRegistered
    UNION
    SELECT label, name, evt_block_time FROM ethereumnameservice_ethereum.ETHRegistrarController_2_evt_NameRegistered
    UNION
    SELECT label, name, evt_block_time FROM ethereumnameservice_ethereum.ETHRegistrarController_3_evt_NameRegistered
    UNION
    SELECT label, name, evt_block_time FROM ethereumnameservice_ethereum.ETHRegistrarController_4_evt_NameRegistered
    UNION
    SELECT labelhash as label, label as name, evt_block_time FROM ethereumnameservice_ethereum.ETHRegistrarController_5_evt_NameRegistered
) AS r
GROUP BY 1
```

---

## Query #650661: Monthly New Addresses (returns ~69 rows)

```sql
SELECT first_registration_date AS total_new_user, COUNT(*)
FROM (
    SELECT owner, MIN(month) AS first_registration_date
    FROM (
        SELECT *
        FROM (
            SELECT node, owner, DATE_TRUNC('month', MIN(evt_block_time)) AS month
            FROM (
                SELECT node, owner, evt_block_time FROM ethereumnameservice_ethereum.NameWrapper_evt_NameWrapped
                    WHERE FROM_UNIXTIME(cast(expiry as double)) > (CURRENT_TIMESTAMP - INTERVAL '90' day)
                    AND evt_block_time > CAST('2020-05-01' AS TIMESTAMP)
                UNION
                SELECT node, owner, evt_block_time FROM ethereumnameservice_ethereum.ENSRegistry_evt_NewOwner
                    WHERE evt_block_time > CAST('2020-05-01' AS TIMESTAMP)
                    AND owner != 0xd4416b13d2b3a9abae7acd5d6c2bbdbe25686401
                UNION
                SELECT node, owner, evt_block_time FROM ethereumnameservice_ethereum.ENSRegistry_evt_Transfer
                    WHERE evt_block_time > CAST('2020-05-01' AS TIMESTAMP)
                    AND owner != 0xd4416b13d2b3a9abae7acd5d6c2bbdbe25686401
                UNION
                SELECT node, owner, evt_block_time FROM ethereumnameservice_ethereum.ENSRegistryWithFallback_evt_NewOwner
                    WHERE evt_block_time > CAST('2020-05-01' AS TIMESTAMP)
                    AND owner != 0xd4416b13d2b3a9abae7acd5d6c2bbdbe25686401
                UNION
                SELECT node, owner, evt_block_time FROM ethereumnameservice_ethereum.ENSRegistryWithFallback_evt_Transfer
                    WHERE evt_block_time > CAST('2020-05-01' AS TIMESTAMP)
                    AND owner != 0xd4416b13d2b3a9abae7acd5d6c2bbdbe25686401
            ) AS rr
            GROUP BY node, owner
        ) AS c
    ) AS c1
    GROUP BY owner
) AS a
GROUP BY first_registration_date
ORDER BY first_registration_date DESC NULLS FIRST
```

---

## Query #1347864: ENS Registrations per Day (Steakhouse) — returns ~90 rows

```sql
WITH events AS (
    SELECT evt_block_time, 'new' AS type FROM ethereumnameservice_ethereum.ETHRegistrarController_1_evt_NameRegistered
    UNION ALL
    SELECT evt_block_time, 'new' AS type FROM ethereumnameservice_ethereum.ETHRegistrarController_2_evt_NameRegistered
    UNION ALL
    SELECT evt_block_time, 'new' AS type FROM ethereumnameservice_ethereum.ETHRegistrarController_3_evt_NameRegistered
    UNION ALL
    SELECT evt_block_time, 'new' AS type FROM ethereumnameservice_ethereum.ETHRegistrarController_4_evt_NameRegistered
    UNION ALL
    SELECT evt_block_time, 'new' AS type FROM ethereumnameservice_ethereum.ETHRegistrarController_5_evt_NameRegistered
    UNION ALL
    SELECT evt_block_time, 'renew' FROM ethereumnameservice_ethereum.ETHRegistrarController_1_evt_NameRenewed
    UNION ALL
    SELECT evt_block_time, 'renew' FROM ethereumnameservice_ethereum.ETHRegistrarController_2_evt_NameRenewed
    UNION ALL
    SELECT evt_block_time, 'renew' FROM ethereumnameservice_ethereum.ETHRegistrarController_3_evt_NameRenewed
    UNION ALL
    SELECT evt_block_time, 'renew' FROM ethereumnameservice_ethereum.ETHRegistrarController_4_evt_NameRenewed
    UNION ALL
    SELECT evt_block_time, 'renew' FROM ethereumnameservice_ethereum.ETHRegistrarController_5_evt_NameRenewed
),
aggregated AS (
    SELECT CAST(evt_block_time AS DATE) AS period, type, COUNT(*) AS cnt FROM events GROUP BY 1, 2
),
summary AS (
    SELECT period,
        SUM(CASE WHEN type = 'new' THEN cnt ELSE 0 END) AS new_cnt,
        SUM(CASE WHEN type = 'renew' THEN cnt ELSE 0 END) AS renew_cnt
    FROM aggregated GROUP BY 1
)
SELECT period, new_cnt, renew_cnt, new_cnt + COALESCE(renew_cnt, 0) AS cnt
FROM summary
WHERE period > CURRENT_DATE - interval '90' day
ORDER BY 1 DESC
```

---

## Query #3069494: ENS Revenues per Day (Steakhouse) — returns ~365 rows

```sql
-- Depends on query_2244104 (ENS Accounting Main) — a 500+ line Steakhouse Financial
-- full double-entry accounting system with 25+ materialized views.
-- We should NOT replicate this. For revenue, use a simpler approach:
-- sum(cost * ETH_price) from registration/renewal events.

WITH entries AS (
    SELECT * FROM query_2244104 -- result_ens_accounting_main
),
daily_items AS (
    SELECT '1' as rk, 'Registrations' as item, date_trunc('day', ts) as period,
        sum(case when cast(account as varchar) like '3211%' then amount end) as amount
    FROM entries GROUP BY 3
    UNION ALL
    SELECT '2' as rk, 'Renewals' as item, date_trunc('day', ts) as period,
        sum(case when cast(account as varchar) like '3212%' then amount end) as amount
    FROM entries GROUP BY 3
    UNION ALL
    SELECT '3' as rk, 'Short Name Claims' as item, date_trunc('day', ts) as period,
        sum(case when cast(account as varchar) like '3213%' then amount end) as amount
    FROM entries GROUP BY 3
)
SELECT di.rk, di.item, di.period, di.amount
FROM daily_items di
WHERE di.period >= current_date - interval '365' day
```
