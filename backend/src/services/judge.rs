//! OpenClaw AI judge service — stub.
//! TODO: See docs/ISSUES.md for full implementation spec.

use anyhow::Result;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct JudgeVerdict {
    pub winner: String,           // "freelancer" | "client" | "split"
    pub freelancer_share_bps: i32,
    pub reasoning: String,
}

pub struct JudgeService;

impl JudgeService {
    pub fn from_env() -> Self { Self }

    /// TODO: Call OpenClaw agent API with job spec + evidence.
    /// See docs/ISSUES.md — "OpenClaw Full SDK Integration".
    pub async fn judge(
        &self,
        _job_spec: &str,
        _deliverable_hash: &str,
        _client_evidence: Vec<String>,
        _freelancer_evidence: Vec<String>,
    ) -> Result<JudgeVerdict> {
        todo!("Implement OpenClaw judge — see docs/ISSUES.md")
    }
}
