-- ============================================================================
-- ENS Pulse: Protocol Stats (Query 1 of 2)
-- ============================================================================
-- Consolidates 7 Dune API calls into 1 query returning 1 row.
-- Replaces: #5768, #6491, #2101527, #5676, #650661
--
-- References materialized views maintained by ENS team:
--   query_2406277 = ens_view_registries
--   query_2406565 = ens_view_expirations
--
-- Output columns:
--   total_active_names, unique_participants, primary_names_set,
--   current_month_regs, prev_month_regs,
--   current_month_new_addrs, prev_month_new_addrs
-- ============================================================================

WITH

-- ┌─────────────────────────────────────────────────┐
-- │ 1. Total Active Names (from #5768)              │
-- │    Active .eth names + non-.eth names            │
-- └─────────────────────────────────────────────────┘
total_names AS (
    SELECT COUNT(*) AS cnt
    FROM (
        -- Active .eth names (not expired within 90-day grace period)
        SELECT c.tokenid
        FROM query_2406277 AS c
        JOIN query_2406565 AS e
            ON c.tokenid = e.tokenid
            AND c.node = 0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae /* .eth */
        WHERE e.max_expires > (CURRENT_TIMESTAMP - INTERVAL '90' day)

        UNION ALL

        -- Non-.eth names (no expiry — DNS imports, subdomains, etc.)
        SELECT tokenid
        FROM query_2406277
        WHERE node NOT IN (
            0x0000000000000000000000000000000000000000000000000000000000000000, /* root */
            0x91d1777781884d03a6757a803996e38de2a42967fb37eeaca72729271025a9e2, /* addr.reverse */
            0xa097f6721ce401e757d1223a763fef49b8b5f90bb18567ddb86fd205dff71d34, /* reverse */
            0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae  /* .eth */
        )
    ) AS all_names
),

-- ┌─────────────────────────────────────────────────┐
-- │ 2. Unique Participants (from #6491)             │
-- │    Distinct owners across all active ENS names   │
-- └─────────────────────────────────────────────────┘
participants AS (
    SELECT COUNT(*) AS cnt
    FROM (
        -- Wrapped name owners (active)
        SELECT owner
        FROM (
            SELECT name, node, owner
            FROM ethereumnameservice_ethereum.NameWrapper_evt_NameWrapped
            WHERE FROM_UNIXTIME(CAST(expiry AS double)) > (CURRENT_TIMESTAMP - INTERVAL '90' day)
            GROUP BY name, node, owner
        ) wrapped
        GROUP BY owner

        UNION

        -- Active .eth name owners (excluding NameWrapper contract)
        SELECT owner
        FROM (
            SELECT c.owner
            FROM (
                SELECT node, label, bytearray_to_uint256(label) AS tokenid, owner
                FROM (
                    SELECT * FROM ethereumnameservice_ethereum.ENSRegistry_evt_NewOwner
                    UNION
                    SELECT * FROM ethereumnameservice_ethereum.ENSRegistryWithFallback_evt_NewOwner
                ) rr
                GROUP BY node, label, owner
            ) c
            JOIN query_2406565 AS e
                ON c.tokenid = e.tokenid
                AND c.node = 0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae
                AND c.owner != 0xd4416b13d2b3a9abae7acd5d6c2bbdbe25686401 /* NameWrapper */
            WHERE e.max_expires > (CURRENT_TIMESTAMP - INTERVAL '90' day)
        ) eth_owners
        GROUP BY owner

        UNION

        -- Non-.eth name owners
        SELECT owner
        FROM (
            SELECT node, label, owner
            FROM (
                SELECT * FROM ethereumnameservice_ethereum.ENSRegistry_evt_NewOwner
                UNION
                SELECT * FROM ethereumnameservice_ethereum.ENSRegistryWithFallback_evt_NewOwner
            ) rr
            WHERE rr.node NOT IN (
                0x0000000000000000000000000000000000000000000000000000000000000000,
                0x91d1777781884d03a6757a803996e38de2a42967fb37eeaca72729271025a9e2,
                0xa097f6721ce401e757d1223a763fef49b8b5f90bb18567ddb86fd205dff71d34,
                0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae
            )
            AND rr.owner != 0xd4416b13d2b3a9abae7acd5d6c2bbdbe25686401
            GROUP BY node, label, owner
        ) non_eth_owners
        GROUP BY owner
    ) all_owners
),

-- ┌─────────────────────────────────────────────────┐
-- │ 3. Primary Names Set (from #2101527)            │
-- │    Addresses that set a reverse/primary name     │
-- └─────────────────────────────────────────────────┘
primary_names AS (
    SELECT COUNT(DISTINCT label) AS cnt
    FROM query_2406277
    WHERE node = 0x91d1777781884d03a6757a803996e38de2a42967fb37eeaca72729271025a9e2 /* addr.reverse */
),

-- ┌─────────────────────────────────────────────────┐
-- │ 4. Monthly .eth Registrations (from #5676)      │
-- │    Current month + previous month for delta      │
-- └─────────────────────────────────────────────────┘
all_registrations AS (
    SELECT evt_block_time
    FROM ethereumnameservice_ethereum.ETHRegistrarController_1_evt_NameRegistered
    UNION ALL
    SELECT evt_block_time
    FROM ethereumnameservice_ethereum.ETHRegistrarController_2_evt_NameRegistered
    UNION ALL
    SELECT evt_block_time
    FROM ethereumnameservice_ethereum.ETHRegistrarController_3_evt_NameRegistered
    UNION ALL
    SELECT evt_block_time
    FROM ethereumnameservice_ethereum.ETHRegistrarController_4_evt_NameRegistered
    UNION ALL
    SELECT evt_block_time
    FROM ethereumnameservice_ethereum.ETHRegistrarController_5_evt_NameRegistered
),
monthly_regs AS (
    SELECT
        SUM(CASE WHEN DATE_TRUNC('month', evt_block_time) = DATE_TRUNC('month', CURRENT_DATE)
            THEN 1 ELSE 0 END) AS current_month,
        SUM(CASE WHEN DATE_TRUNC('month', evt_block_time) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1' month)
            THEN 1 ELSE 0 END) AS prev_month
    FROM all_registrations
    WHERE evt_block_time >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1' month)
),

-- ┌─────────────────────────────────────────────────┐
-- │ 5. Monthly New Addresses (from #650661)         │
-- │    First-time ENS participants per month          │
-- └─────────────────────────────────────────────────┘
owner_first_activity AS (
    SELECT owner, MIN(evt_block_time) AS first_seen
    FROM (
        SELECT owner, evt_block_time
        FROM ethereumnameservice_ethereum.NameWrapper_evt_NameWrapped
        WHERE FROM_UNIXTIME(CAST(expiry AS double)) > (CURRENT_TIMESTAMP - INTERVAL '90' day)
            AND evt_block_time > TIMESTAMP '2020-05-01'
        UNION
        SELECT owner, evt_block_time
        FROM ethereumnameservice_ethereum.ENSRegistry_evt_NewOwner
        WHERE evt_block_time > TIMESTAMP '2020-05-01'
            AND owner != 0xd4416b13d2b3a9abae7acd5d6c2bbdbe25686401
        UNION
        SELECT owner, evt_block_time
        FROM ethereumnameservice_ethereum.ENSRegistry_evt_Transfer
        WHERE evt_block_time > TIMESTAMP '2020-05-01'
            AND owner != 0xd4416b13d2b3a9abae7acd5d6c2bbdbe25686401
        UNION
        SELECT owner, evt_block_time
        FROM ethereumnameservice_ethereum.ENSRegistryWithFallback_evt_NewOwner
        WHERE evt_block_time > TIMESTAMP '2020-05-01'
            AND owner != 0xd4416b13d2b3a9abae7acd5d6c2bbdbe25686401
        UNION
        SELECT owner, evt_block_time
        FROM ethereumnameservice_ethereum.ENSRegistryWithFallback_evt_Transfer
        WHERE evt_block_time > TIMESTAMP '2020-05-01'
            AND owner != 0xd4416b13d2b3a9abae7acd5d6c2bbdbe25686401
    ) all_events
    GROUP BY owner
),
monthly_new_addrs AS (
    SELECT
        SUM(CASE WHEN DATE_TRUNC('month', first_seen) = DATE_TRUNC('month', CURRENT_DATE)
            THEN 1 ELSE 0 END) AS current_month,
        SUM(CASE WHEN DATE_TRUNC('month', first_seen) = DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1' month)
            THEN 1 ELSE 0 END) AS prev_month
    FROM owner_first_activity
    WHERE first_seen >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1' month)
)

-- ┌─────────────────────────────────────────────────┐
-- │ FINAL OUTPUT: 1 row with all metrics            │
-- └─────────────────────────────────────────────────┘
SELECT
    (SELECT cnt FROM total_names)       AS total_active_names,
    (SELECT cnt FROM participants)      AS unique_participants,
    (SELECT cnt FROM primary_names)     AS primary_names_set,
    (SELECT current_month FROM monthly_regs) AS current_month_registrations,
    (SELECT prev_month FROM monthly_regs)    AS prev_month_registrations,
    (SELECT current_month FROM monthly_new_addrs) AS current_month_new_addresses,
    (SELECT prev_month FROM monthly_new_addrs)    AS prev_month_new_addresses
