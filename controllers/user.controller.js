import User from '../models/user.model.js';
import crypto from 'crypto';
import sendVerificationEmail from '../utils/sendMail.util.js';
import jwt from 'jsonwebtoken';

async function registerUser(req, res) {
  const { name, email, password } = req.body;
  console.log(req.body);

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'All feilds are required',
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      sucess: false,
      message: 'Password must be at least 8 characters long',
    });
  }

  try {
    const existingUser = await User.findOne({
      email,
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      });
    }
    console.log('User does not exist');

    const token = crypto.randomBytes(32).toString('hex');
    console.log(token);
    const tokenExpiry = Date.now() + 10 * 60 * 60 * 1000;
    console.log(tokenExpiry);

    const user = await User.create({
      name,
      email,
      password,
      verificationToken: token,
      verificationTokenExpiry: tokenExpiry,
    });

    console.log('User created', user);

    if (!user) {
      return res.status(500).json({
        success: false,
        message: 'User registration failed',
      });
    }

    await sendVerificationEmail(user.email, token);
    console.log('Verification email sent');

    return res.status(201).json({
      success: true,
      message:
        'User registered successfully. Please check your email for verification.',
    });
  } catch (error) {
    console.error('Error registering user: ', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}

async function verifyUser(req, res) {
  try {
    const token = req.params.token;
    console.log(token);

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpiry: { $gt: Date.now() },
    });
    console.log(user);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'User verified successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}

async function loginUser(req, res) {
  const { email, password } = req.body;
  console.log(req.body);

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required',
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters long',
    });
  }

  try {
    const user = await User.findOne({
      email,
    });
    console.log('User found', user);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'User not verified',
      });
    }

    const isPasswordMatch = await user.comparePassword(password);
    console.log('password match', isPasswordMatch);

    if (!isPasswordMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    /* const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    console.log("JWT token", jwtToken); */

    const accessToken = jwt.sign(
      { id: user._id },
      process.env.ACCESSTOKEN_SECRET,
      {
        expiresIn: process.env.ACCESSTOKEN_EXPIRY,
      },
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.REFRESHTOKEN_SECRET,
      {
        expiresIn: process.env.REFRESHTOKEN_EXPIRY,
      },
    );
    user.refreshToken = refreshToken;

    await user.save();

    const cookieOptions = {
      httpOnly: true,
    };

    /* res.cookie("jwtToken", jwtToken, {
      httpOnly: true,
      maxAge: new Date(Date.now() + 24 * 60 * 60 * 1000),
    }); */

    res.cookie('accessToken', accessToken, cookieOptions);
    res.cookie('refreshToken', refreshToken, cookieOptions);

    return res.status(200).json({
      success: true,
      message: 'User logged in successfully',
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}

async function getProfile(req, res) {
  console.log('req user', req.user);
  const userId = req.user.id;
  console.log('user id', userId);
  try {
    const user = await User.findById(userId).select(
      '-password -verificationToken -verificationTokenExpiry',
    );
    console.log('user found', user);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}

export { registerUser, verifyUser, loginUser, getProfile };
