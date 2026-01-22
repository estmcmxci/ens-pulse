import postgres from "postgres";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("DATABASE_URL not set - database features will be disabled");
}

export const sql = connectionString
  ? postgres(connectionString, {
      ssl: { rejectUnauthorized: false },
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    })
  : null;

// Initialize the snapshots table if it doesn't exist
export async function initializeDatabase() {
  if (!sql) {
    console.warn("Database not configured");
    return false;
  }

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS ens_stats_snapshots (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL UNIQUE,
        total_ens_created BIGINT,
        unique_participants BIGINT,
        total_primary_names BIGINT,
        monthly_registrations BIGINT,
        monthly_new_addresses BIGINT,
        total_content_hash BIGINT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    // Create index for faster date lookups
    await sql`
      CREATE INDEX IF NOT EXISTS idx_ens_stats_date
      ON ens_stats_snapshots(date DESC)
    `;

    return true;
  } catch (error) {
    console.error("Failed to initialize database:", error);
    return false;
  }
}

// Save a daily snapshot
export async function saveSnapshot(data: {
  totalEnsCreated: number | null;
  uniqueParticipants: number | null;
  totalPrimaryNames: number | null;
  monthlyRegistrations: number | null;
  monthlyNewAddresses: number | null;
  totalContentHash: number | null;
}) {
  if (!sql) {
    throw new Error("Database not configured");
  }

  const today = new Date().toISOString().split("T")[0];

  await sql`
    INSERT INTO ens_stats_snapshots (
      date,
      total_ens_created,
      unique_participants,
      total_primary_names,
      monthly_registrations,
      monthly_new_addresses,
      total_content_hash
    ) VALUES (
      ${today},
      ${data.totalEnsCreated},
      ${data.uniqueParticipants},
      ${data.totalPrimaryNames},
      ${data.monthlyRegistrations},
      ${data.monthlyNewAddresses},
      ${data.totalContentHash}
    )
    ON CONFLICT (date) DO UPDATE SET
      total_ens_created = EXCLUDED.total_ens_created,
      unique_participants = EXCLUDED.unique_participants,
      total_primary_names = EXCLUDED.total_primary_names,
      monthly_registrations = EXCLUDED.monthly_registrations,
      monthly_new_addresses = EXCLUDED.monthly_new_addresses,
      total_content_hash = EXCLUDED.total_content_hash,
      created_at = NOW()
  `;
}

// Get snapshot from N days ago
export async function getSnapshotFromDaysAgo(daysAgo: number) {
  if (!sql) {
    return null;
  }

  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - daysAgo);
  const dateStr = targetDate.toISOString().split("T")[0];

  const result = await sql`
    SELECT * FROM ens_stats_snapshots
    WHERE date <= ${dateStr}
    ORDER BY date DESC
    LIMIT 1
  `;

  return result[0] || null;
}

// Get the most recent snapshot
export async function getLatestSnapshot() {
  if (!sql) {
    return null;
  }

  const result = await sql`
    SELECT * FROM ens_stats_snapshots
    ORDER BY date DESC
    LIMIT 1
  `;

  return result[0] || null;
}

// Get snapshot count (to check if we have enough history)
export async function getSnapshotCount() {
  if (!sql) {
    return 0;
  }

  const result = await sql`
    SELECT COUNT(*) as count FROM ens_stats_snapshots
  `;

  return Number(result[0]?.count) || 0;
}
