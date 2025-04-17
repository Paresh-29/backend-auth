import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

async function isLoggedIn(req, res, next) {
  try {
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    if (!accessToken) {
      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      // Verify the refreshToken
      const refreshDecoded = jwt.verify(
        refreshToken,
        process.env.REFRESHTOKEN_SECRET,
      );

      const user = await User.findOne({ _id: refreshDecoded.id });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized access',
        });
      }

      const newAccessToken = jwt.sign(
        { id: user._id },
        process.env.ACCESSTOKEN_SECRET,
        {
          expiresIn: '15m',
        },
      );

      const newRefreshToken = jwt.sign(
        { id: user._id },
        process.env.REFRESHTOKEN_SECRET,
        {
          expiresIn: '12h',
        },
      );

      user.refreshToken = newRefreshToken;

      await user.save();

      const cookieOptions = {
        httpOnly: true,
      };

      res.cookie('accessToken', newAccessToken, cookieOptions);
      res.cookie('refreshToken', newRefreshToken, cookieOptions);

      req.user = refreshDecoded;
      next();
    } else {
      const accessDecoded = jwt.verify(
        accessToken,
        process.env.ACCESSTOKEN_SECRET,
      );

      const user = await User.findOne({ _id: accessDecoded.id });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized access',
        });
      }

      const newAccessToken = jwt.sign(
        { id: user._id },
        process.env.ACCESSTOKEN_SECRET,
        {
          expiresIn: '15m',
        },
      );

      const newRefreshToken = jwt.sign(
        { id: user._id },
        process.env.REFRESHTOKEN_SECRET,
        {
          expiresIn: '12h',
        },
      );

      user.refreshToken = newRefreshToken;
      await user.save();

      const cookieOptions = {
        httpOnly: true,
      };
      res.cookie('accessToken', newAccessToken, cookieOptions);
      res.cookie('refreshToken', newRefreshToken, cookieOptions);

      req.user = accessDecoded;
      next();
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}

export default isLoggedIn;
