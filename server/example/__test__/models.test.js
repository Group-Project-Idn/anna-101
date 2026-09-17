const { User } = require('../models');

describe('User model hooks (no DB)', () => {
  describe('beforeUpdate hook', () => {
    it('should hash password when password is changed and present', async () => {
      const mockUser = {
        password: 'new-secret',
        changed: (field) => field === 'password',
      };

      await User.runHooks('beforeUpdate', mockUser, {});

      expect(mockUser.password).not.toBe('new-secret');
      expect(mockUser.password.length).toBeGreaterThan(20); // bcrypt hash
    });

    it('should not hash password when password is not changed', async () => {
      const mockUser = {
        password: 'keep-me',
        changed: () => false,
      };

      await User.runHooks('beforeUpdate', mockUser, {});

      expect(mockUser.password).toBe('keep-me');
    });

    it('should not hash password when changed but password is empty', async () => {
      const mockUser = {
        password: '',
        changed: (field) => field === 'password',
      };

      await User.runHooks('beforeUpdate', mockUser, {});

      expect(mockUser.password).toBe('');
    });

    it('should not hash password when changed but password is null', async () => {
      const mockUser = {
        password: null,
        changed: () => true,
      };

      await User.runHooks('beforeUpdate', mockUser, {});

      expect(mockUser.password).toBeNull();
    });
  });

  describe('beforeCreate hook', () => {
    it('should hash password when present', async () => {
      const mockUser = { password: 'plain-text' };

      await User.runHooks('beforeCreate', mockUser, {});

      expect(mockUser.password).not.toBe('plain-text');
    });

    it('should leave password untouched when absent', async () => {
      const mockUser = { password: undefined };

      await User.runHooks('beforeCreate', mockUser, {});

      expect(mockUser.password).toBeUndefined();
    });
  });
});

describe('models/index.js - use_env_variable branch', () => {
  afterEach(() => {
    delete process.env.TEST_DATABASE_URL;
    jest.dontMock('../config/config.json');
  });

  it('should construct Sequelize from process.env when config.use_env_variable is set', () => {
    const mockConfig = {
      development: { use_env_variable: 'TEST_DATABASE_URL', dialect: 'postgres' },
      test: { use_env_variable: 'TEST_DATABASE_URL', dialect: 'postgres' },
      production: { use_env_variable: 'TEST_DATABASE_URL', dialect: 'postgres' },
    };
    jest.doMock('../config/config.json', () => mockConfig);
    process.env.TEST_DATABASE_URL = 'postgres://user:pass@localhost:5432/envdb';

    jest.isolateModules(() => {
      const db = require('../models');
      expect(db.sequelize).toBeDefined();
      expect(db.Sequelize).toBeDefined();
    });
  });
});