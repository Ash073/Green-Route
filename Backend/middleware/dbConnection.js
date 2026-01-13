import { connectionState } from '../db.js';

// Returns 503 if the database is not connected, preventing Mongoose buffering timeouts
export function requireDB(req, res, next) {
  const state = connectionState();
  if (state !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Database not connected',
      details: 'Please try again later. The server is up but the DB connection is down.',
      connectionState: state,
    });
  }
  next();
}
