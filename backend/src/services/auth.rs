use axum::{
    extract::{Request, State},
    http::StatusCode,
    middleware::Next,
    response::Response,
};
use chrono::Utc;

use crate::db::AppState;

pub async fn auth_middleware(
    State(state): State<AppState>,
    mut request: Request,
    next: Next,
) -> core::result::Result<Response, StatusCode> {
    let auth_header = request
        .headers()
        .get("Authorization")
        .and_then(|h| h.to_str().ok());

    let token = match auth_header.and_then(|header| header.strip_prefix("Bearer ")) {
        Some(token) => token,
        _ => return Err(StatusCode::UNAUTHORIZED),
    };

    let session = sqlx::query!(
        "SELECT address FROM sessions WHERE token = $1 AND expires_at > $2",
        token,
        Utc::now()
    )
    .fetch_optional(&state.pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    if let Some(row) = session {
        request.extensions_mut().insert(row.address);
        Ok(next.run(request).await)
    } else {
        Err(StatusCode::UNAUTHORIZED)
    }
}
