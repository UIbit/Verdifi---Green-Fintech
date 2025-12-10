/**
 * Authentication Middleware
 * Protects routes that require authentication
 */

export const requireAuth = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  } else {
    return res.redirect('/login');
  }
};

export const requireGuest = (req, res, next) => {
  if (req.session && req.session.userId) {
    return res.redirect('/dashboard');
  } else {
    return next();
  }
};

