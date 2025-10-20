// Send JWT token in cookie
const sendToken = (user, statusCode, res, message = 'Success') => {
  const token = user.getJWTToken();

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };

  // Update user's last login
  user.lastLogin = new Date();
  user.save({ validateBeforeSave: false });

  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    message,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      isEmailVerified: user.isEmailVerified
    },
    token
  });
};

module.exports = sendToken;
