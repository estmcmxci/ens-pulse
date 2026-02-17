-- ============================================================================
-- ENS Pulse: Revenue & Daily Registration Stats (Query 2 of 2)
-- ============================================================================
-- Consolidates 5 Dune API calls into 1 query returning 1 row.
-- Replaces: #1347864, #3069494 (+ its dependency on the 500-line Steakhouse
--           accounting system query_2244104)
--
-- Uses cash-basis revenue: sum(cost_in_ETH × ETH_price_USD) per day
-- This differs from Steakhouse's accrual approach but is more appropriate
-- for a governance dashboard (shows actual ETH received per day).
--
-- Output columns:
--   daily_registrations, prev_daily_registrations,
--   daily_revenue_usd, prev_daily_revenue_usd,
--   monthly_revenue_usd, prev_monthly_revenue_usd
-- ============================================================================

WITH

-- ┌─────────────────────────────────────────────────┐
-- │ ETH closing price per day from prices.usd       │
-- └─────────────────────────────────────────────────┘
eth_prices AS (
    SELECT
        DATE_TRUNC('day', minute) AS day,
        price AS eth_price
    FROM prices.usd
    WHERE blockchain = 'ethereum'
        AND contract_address = 0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2 /* WETH */
        AND EXTRACT(HOUR FROM minute) = 23
        AND EXTRACT(MINUTE FROM minute) = 59
        AND minute >= CURRENT_DATE - INTERVAL '65' day
),

-- ┌─────────────────────────────────────────────────┐
-- │ All registration events with cost (ETH)         │
-- │ Across all 5 controller versions                │
-- └─────────────────────────────────────────────────┘
registration_events AS (
    -- Controllers v1-v3: have `cost` field directly
    SELECT evt_block_time, cost / 1e18 AS cost_eth, 'new' AS event_type
    FROM ethereumnameservice_ethereum.ETHRegistrarController_1_evt_NameRegistered
    WHERE evt_block_time >= CURRENT_DATE - INTERVAL '65' day
    UNION ALL
    SELECT evt_block_time, cost / 1e18, 'new'
    FROM ethereumnameservice_ethereum.ETHRegistrarController_2_evt_NameRegistered
    WHERE evt_block_time >= CURRENT_DATE - INTERVAL '65' day
    UNION ALL
    SELECT evt_block_time, cost / 1e18, 'new'
    FROM ethereumnameservice_ethereum.ETHRegistrarController_3_evt_NameRegistered
    WHERE evt_block_time >= CURRENT_DATE - INTERVAL '65' day
    UNION ALL
    -- Controller v4: baseCost + premium
    SELECT evt_block_time, (baseCost + premium) / 1e18, 'new'
    FROM ethereumnameservice_ethereum.ETHRegistrarController_4_evt_NameRegistered
    WHERE evt_block_time >= CURRENT_DATE - INTERVAL '65' day
    UNION ALL
    -- Controller v5: baseCost + premium (same pattern as v4)
    SELECT evt_block_time, (baseCost + premium) / 1e18, 'new'
    FROM ethereumnameservice_ethereum.ETHRegistrarController_5_evt_NameRegistered
    WHERE evt_block_time >= CURRENT_DATE - INTERVAL '65' day
),

-- ┌─────────────────────────────────────────────────┐
-- │ All renewal events with cost (ETH)              │
-- └─────────────────────────────────────────────────┘
renewal_events AS (
    SELECT evt_block_time, cost / 1e18 AS cost_eth, 'renew' AS event_type
    FROM ethereumnameservice_ethereum.ETHRegistrarController_1_evt_NameRenewed
    WHERE evt_block_time >= CURRENT_DATE - INTERVAL '65' day
    UNION ALL
    SELECT evt_block_time, cost / 1e18, 'renew'
    FROM ethereumnameservice_ethereum.ETHRegistrarController_2_evt_NameRenewed
    WHERE evt_block_time >= CURRENT_DATE - INTERVAL '65' day
    UNION ALL
    SELECT evt_block_time, cost / 1e18, 'renew'
    FROM ethereumnameservice_ethereum.ETHRegistrarController_3_evt_NameRenewed
    WHERE evt_block_time >= CURRENT_DATE - INTERVAL '65' day
    UNION ALL
    SELECT evt_block_time, cost / 1e18, 'renew'
    FROM ethereumnameservice_ethereum.ETHRegistrarController_4_evt_NameRenewed
    WHERE evt_block_time >= CURRENT_DATE - INTERVAL '65' day
    UNION ALL
    SELECT evt_block_time, cost / 1e18, 'renew'
    FROM ethereumnameservice_ethereum.ETHRegistrarController_5_evt_NameRenewed
    WHERE evt_block_time >= CURRENT_DATE - INTERVAL '65' day
),

-- ┌─────────────────────────────────────────────────┐
-- │ Combined events                                 │
-- └─────────────────────────────────────────────────┘
all_events AS (
    SELECT * FROM registration_events
    UNION ALL
    SELECT * FROM renewal_events
),

-- ┌─────────────────────────────────────────────────┐
-- │ Daily aggregation with USD revenue              │
-- └─────────────────────────────────────────────────┘
daily_stats AS (
    SELECT
        CAST(evt_block_time AS DATE) AS day,
        -- Registration counts
        SUM(CASE WHEN event_type = 'new' THEN 1 ELSE 0 END) AS new_registrations,
        SUM(CASE WHEN event_type = 'renew' THEN 1 ELSE 0 END) AS renewals,
        COUNT(*) AS total_events,
        -- Revenue in ETH
        SUM(cost_eth) AS revenue_eth,
        -- Revenue in USD (cost_eth × ETH price that day)
        SUM(cost_eth * COALESCE(p.eth_price, 0)) AS revenue_usd
    FROM all_events e
    LEFT JOIN eth_prices p ON CAST(e.evt_block_time AS DATE) = p.day
    GROUP BY 1
),

-- ┌─────────────────────────────────────────────────┐
-- │ Pick the two most recent complete days           │
-- │ (yesterday and day before — today is incomplete)  │
-- └─────────────────────────────────────────────────┘
yesterday AS (
    SELECT * FROM daily_stats
    WHERE day = CURRENT_DATE - INTERVAL '1' day
),
day_before AS (
    SELECT * FROM daily_stats
    WHERE day = CURRENT_DATE - INTERVAL '2' day
),

-- ┌─────────────────────────────────────────────────┐
-- │ Monthly revenue: last 30 days vs prior 30 days  │
-- └─────────────────────────────────────────────────┘
monthly_revenue AS (
    SELECT
        SUM(CASE WHEN day >= CURRENT_DATE - INTERVAL '30' day AND day < CURRENT_DATE
            THEN revenue_usd ELSE 0 END) AS last_30d,
        SUM(CASE WHEN day >= CURRENT_DATE - INTERVAL '60' day AND day < CURRENT_DATE - INTERVAL '30' day
            THEN revenue_usd ELSE 0 END) AS prev_30d
    FROM daily_stats
)

-- ┌─────────────────────────────────────────────────┐
-- │ FINAL OUTPUT: 1 row with all revenue metrics    │
-- └─────────────────────────────────────────────────┘
SELECT
    -- Daily registrations (new only, yesterday vs day before)
    COALESCE((SELECT new_registrations FROM yesterday), 0) AS daily_registrations,
    COALESCE((SELECT new_registrations FROM day_before), 0) AS prev_daily_registrations,
    -- Daily revenue in USD (all revenue — regs + renewals)
    COALESCE((SELECT revenue_usd FROM yesterday), 0) AS daily_revenue_usd,
    COALESCE((SELECT revenue_usd FROM day_before), 0) AS prev_daily_revenue_usd,
    -- Monthly revenue in USD (last 30 days vs prior 30 days)
    COALESCE((SELECT last_30d FROM monthly_revenue), 0) AS monthly_revenue_usd,
    COALESCE((SELECT prev_30d FROM monthly_revenue), 0) AS prev_monthly_revenue_usd
