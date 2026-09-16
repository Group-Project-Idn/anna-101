const { comparePassword } = require('../helpers/bcrypt');
const { signToken } = require('../helpers/jwt');
const { User } = require('../models');
const { OAuth2Client } = require('google-auth-library');

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
console.log('GOOGLE_CLIENT_ID loaded:', GOOGLE_CLIENT_ID ? 'YES' : 'NO');
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

class AuthController {
  static async register(req, res, next) {
    try {
      const { email, password, name } = req.body;

      if (!email || !password || !name) {
        throw { name: 'BadRequest', message: 'Email, password, and name are required.' };
      }

      if (password.length < 5) {
        throw { name: 'BadRequest', message: 'Password must be at least 5 characters.' };
      }

      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        throw { name: 'BadRequest', message: 'Email already registered.' };
      }

      const user = await User.create({
        email,
        password,
        name,
      });

      const payload = {
        id: user.id,
        email: user.email,
        name: user.name,
      };

      const access_token = signToken(payload);

      res.status(201).json({
        message: 'Registration successful.',
        access_token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        throw { name: 'BadRequest', message: 'Email and password are required.' };
      }

      const user = await User.findOne({ where: { email } });

      if (!user) {
        throw { name: 'Unauthorized', message: 'Invalid email or password.' };
      }

      if (!user.password) {
        throw { name: 'Unauthorized', message: 'This account uses Google Sign In.' };
      }

      if (!comparePassword(password, user.password)) {
        throw { name: 'Unauthorized', message: 'Invalid email or password.' };
      }

      user.last_login_at = new Date();
      await user.save();

      const payload = {
        id: user.id,
        email: user.email,
        name: user.name,
      };

      const access_token = signToken(payload);

      res.status(200).json({
        message: 'Login successful.',
        access_token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async googleLogin(req, res, next) {
    try {
      const { id_token } = req.body;

      if (!GOOGLE_CLIENT_ID || !googleClient) {
        throw { name: 'ServiceUnavailable', message: 'Google Sign In not configured. Please set GOOGLE_CLIENT_ID in environment variables.' };
      }

      if (!id_token) {
        throw { name: 'BadRequest', message: 'ID token is required.' };
      }

      const ticket = await googleClient.verifyIdToken({
        idToken: id_token,
        audience: GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      const { sub: google_id, email, name, picture } = payload;

      let user = await User.findOne({ where: { google_id } });

      if (!user) {
        user = await User.findOne({ where: { email } });
        if (user) {
          user.google_id = google_id;
          user.last_login_at = new Date();
          if (picture) user.avatar_url = picture;
          await user.save();
        } else {
          user = await User.create({
            google_id,
            email,
            name,
            avatar_url: picture,
            last_login_at: new Date(),
          });
        }
      } else {
        user.last_login_at = new Date();
        await user.save();
      }

      const tokenPayload = {
        id: user.id,
        email: user.email,
        name: user.name,
      };

      const access_token = signToken(tokenPayload);

      res.status(200).json({
        message: 'Google Sign In successful.',
        access_token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar_url: user.avatar_url,
        },
      });
    } catch (error) {
      if (error.name === 'ServiceUnavailable' || error.name === 'BadRequest') {
        next(error);
      } else {
        next({ name: 'Unauthorized', message: 'Invalid Google ID token.' });
      }
    }
  }

  static async updateProfile(req, res, next) {
    try {
      const { id } = req.loginInfo;
      const { name, avatar_url } = req.body;

      const user = await User.findByPk(id);
      if (!user) {
        throw { name: 'NotFound', message: 'User not found.' };
      }

      if (name !== undefined && (!name || !String(name).trim())) {
        throw { name: 'BadRequest', message: 'Name cannot be empty.' };
      }

      const updates = {};
      if (name !== undefined) updates.name = String(name).trim();
      if (avatar_url !== undefined) updates.avatar_url = avatar_url;

      await user.update(updates);

      res.status(200).json({
        message: 'Profile updated successfully.',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar_url: user.avatar_url,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  static async getMe(req, res, next) {
    try {
      const { id } = req.loginInfo;

      const user = await User.findOne({
        where: { id },
        attributes: { exclude: ['password'] },
      });

      if (!user) {
        throw { name: 'NotFound', message: 'User not found.' };
      }

      res.status(200).json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar_url: user.avatar_url,
          created_at: user.created_at,
          last_login_at: user.last_login_at,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = { AuthController };
