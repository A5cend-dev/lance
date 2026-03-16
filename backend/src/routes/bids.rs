use axum::{
    extract::{Path, State},
    Json,
};
use uuid::Uuid;

use crate::{
    db::AppState,
    error::{AppError, Result},
    models::{Bid, CreateBidRequest},
};

pub async fn list_bids(
    State(state): State<AppState>,
    Path(job_id): Path<Uuid>,
) -> Result<Json<Vec<Bid>>> {
    let bids = sqlx::query_as::<_, Bid>(
        r#"SELECT id, job_id, freelancer_address, proposal, proposal_hash, status, created_at
           FROM bids WHERE job_id = $1 ORDER BY created_at ASC"#
    )
    .bind(job_id)
    .fetch_all(&state.pool)
    .await?;
    Ok(Json(bids))
}

pub async fn create_bid(
    State(state): State<AppState>,
    Path(job_id): Path<Uuid>,
    Json(req): Json<CreateBidRequest>,
) -> Result<Json<Bid>> {
    // ensure job is open
    let job_status: Option<String> = sqlx::query_scalar("SELECT status FROM jobs WHERE id = $1")
        .bind(job_id)
    .fetch_optional(&state.pool)
    .await?;

    match job_status.as_deref() {
        Some("open") => {}
        Some(s) => return Err(AppError::BadRequest(format!("job status is '{s}', not open"))),
        None => return Err(AppError::NotFound(format!("job {job_id} not found"))),
    }

    let bid = sqlx::query_as::<_, Bid>(
        r#"INSERT INTO bids (job_id, freelancer_address, proposal, status)
           VALUES ($1, $2, $3, 'pending')
           RETURNING id, job_id, freelancer_address, proposal, proposal_hash, status, created_at"#
    )
    .bind(job_id)
    .bind(req.freelancer_address)
    .bind(req.proposal)
    .fetch_one(&state.pool)
    .await?;
    Ok(Json(bid))
}
