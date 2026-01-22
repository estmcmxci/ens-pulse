import { db } from "ponder:api";
import * as schema from "ponder:schema";
import { Hono } from "hono";
import { desc, eq, and, gte, lte } from "ponder";

const app = new Hono();

// REST API endpoints
// Note: Ponder provides a built-in /health endpoint
app.get("/proposals", async (c) => {
  const status = c.req.query("status");
  const limit = parseInt(c.req.query("limit") || "20");
  const offset = parseInt(c.req.query("offset") || "0");

  let query = db.select().from(schema.proposal).orderBy(desc(schema.proposal.createdAt));

  if (status) {
    query = query.where(eq(schema.proposal.status, status));
  }

  const proposals = await query.limit(limit).offset(offset);

  return c.json({
    success: true,
    data: proposals,
    pagination: { limit, offset },
  });
});

app.get("/proposals/:id", async (c) => {
  const proposalId = c.req.param("id");

  const proposalData = await db
    .select()
    .from(schema.proposal)
    .where(eq(schema.proposal.id, proposalId))
    .limit(1);

  if (!proposalData.length) {
    return c.json({ success: false, error: "Proposal not found" }, 404);
  }

  const votes = await db
    .select()
    .from(schema.vote)
    .where(eq(schema.vote.proposalId, BigInt(proposalId)))
    .orderBy(desc(schema.vote.weight))
    .limit(100);

  return c.json({
    success: true,
    data: {
      proposal: proposalData[0],
      votes,
    },
  });
});

app.get("/delegates", async (c) => {
  const limit = parseInt(c.req.query("limit") || "50");
  const offset = parseInt(c.req.query("offset") || "0");
  const minVotingPower = c.req.query("minVotingPower");

  let query = db
    .select()
    .from(schema.delegate)
    .orderBy(desc(schema.delegate.votingPower));

  if (minVotingPower) {
    query = query.where(gte(schema.delegate.votingPower, BigInt(minVotingPower)));
  }

  const delegates = await query.limit(limit).offset(offset);

  return c.json({
    success: true,
    data: delegates,
    pagination: { limit, offset },
  });
});

app.get("/delegates/:address", async (c) => {
  const address = c.req.param("address").toLowerCase();

  const delegateData = await db
    .select()
    .from(schema.delegate)
    .where(eq(schema.delegate.address, address))
    .limit(1);

  if (!delegateData.length) {
    return c.json({ success: false, error: "Delegate not found" }, 404);
  }

  const recentVotes = await db
    .select()
    .from(schema.vote)
    .where(eq(schema.vote.voter, address))
    .orderBy(desc(schema.vote.timestamp))
    .limit(20);

  const delegators = await db
    .select()
    .from(schema.delegation)
    .where(eq(schema.delegation.delegate, address))
    .limit(100);

  return c.json({
    success: true,
    data: {
      delegate: delegateData[0],
      recentVotes,
      delegators,
    },
  });
});

app.get("/votes/:proposalId", async (c) => {
  const proposalId = c.req.param("proposalId");
  const limit = parseInt(c.req.query("limit") || "100");
  const offset = parseInt(c.req.query("offset") || "0");
  const support = c.req.query("support");

  let query = db
    .select()
    .from(schema.vote)
    .where(eq(schema.vote.proposalId, BigInt(proposalId)))
    .orderBy(desc(schema.vote.weight));

  if (support !== undefined) {
    query = db
      .select()
      .from(schema.vote)
      .where(
        and(
          eq(schema.vote.proposalId, BigInt(proposalId)),
          eq(schema.vote.support, parseInt(support))
        )
      )
      .orderBy(desc(schema.vote.weight));
  }

  const votes = await query.limit(limit).offset(offset);

  return c.json({
    success: true,
    data: votes,
    pagination: { limit, offset },
  });
});

app.get("/stats", async (c) => {
  const proposalCount = await db.select().from(schema.proposal);
  const delegateCount = await db.select().from(schema.delegate);
  const voteCount = await db.select().from(schema.vote);

  const activeProposals = proposalCount.filter((p) => p.status === "active");
  const executedProposals = proposalCount.filter((p) => p.status === "executed");

  return c.json({
    success: true,
    data: {
      totalProposals: proposalCount.length,
      activeProposals: activeProposals.length,
      executedProposals: executedProposals.length,
      totalDelegates: delegateCount.length,
      totalVotes: voteCount.length,
    },
  });
});

// Treasury Snapshots for historical context
app.get("/treasury-snapshots", async (c) => {
  const limit = parseInt(c.req.query("limit") || "50");
  const offset = parseInt(c.req.query("offset") || "0");
  const startTime = c.req.query("startTime");
  const endTime = c.req.query("endTime");

  let query = db
    .select()
    .from(schema.treasurySnapshot)
    .orderBy(desc(schema.treasurySnapshot.timestamp));

  if (startTime) {
    query = query.where(gte(schema.treasurySnapshot.timestamp, BigInt(startTime)));
  }
  if (endTime) {
    query = query.where(lte(schema.treasurySnapshot.timestamp, BigInt(endTime)));
  }

  const snapshots = await query.limit(limit).offset(offset);

  return c.json({
    success: true,
    data: snapshots,
    pagination: { limit, offset },
  });
});

// Get proposal context (world state when proposal was created)
app.get("/proposal-context/:proposalId", async (c) => {
  const proposalId = c.req.param("proposalId");

  // First get the proposal context data
  const contextData = await db
    .select()
    .from(schema.proposalContext)
    .where(eq(schema.proposalContext.proposalId, BigInt(proposalId)))
    .limit(1);

  // Also get the proposal itself for metadata
  const proposalData = await db
    .select()
    .from(schema.proposal)
    .where(eq(schema.proposal.proposalId, BigInt(proposalId)))
    .limit(1);

  if (!contextData.length) {
    // If no context stored, return empty with a flag
    return c.json({
      success: true,
      data: {
        hasContext: false,
        proposal: proposalData[0] || null,
        context: null,
      },
    });
  }

  return c.json({
    success: true,
    data: {
      hasContext: true,
      proposal: proposalData[0] || null,
      context: contextData[0],
    },
  });
});

export default app;
