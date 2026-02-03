import { EncryptionService } from '../../../src/services/encryption.service';

describe('UserService', () => {
  describe('register', () => {
    it('should register a new user with valid input', async () => {
      // Mock input data
      // const email = 'test@example.com';
      // const firstName = 'John';
      // const lastName = 'Doe';
      // const password = 'SecurePassword123';

      // Mock the repository methods
      // In production, use jest.mock() or dependency injection
      // const result = await UserService.register(input);
      // expect(result.email).toBe(input.email);
    });

    it('should throw ConflictError if user already exists', async () => {
      // Test duplicate user registration
    });

    it('should hash password before storing', async () => {
      // Test password hashing
    });
  });

  describe('login', () => {
    it('should login user with correct credentials', async () => {
      // Test successful login
    });

    it('should throw AuthenticationError with incorrect password', async () => {
      // Test failed login
    });
  });
});

describe('EncryptionService', () => {
  describe('hashPassword', () => {
    it('should hash password correctly', async () => {
      const password = 'TestPassword123';
      const hash = await EncryptionService.hashPassword(password);

      expect(hash).not.toBe(password);
      expect(hash).toBeTruthy();
    });
  });

  describe('comparePassword', () => {
    it('should verify correct password', async () => {
      const password = 'TestPassword123';
      const hash = await EncryptionService.hashPassword(password);
      const isValid = await EncryptionService.comparePassword(password, hash);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'TestPassword123';
      const hash = await EncryptionService.hashPassword(password);
      const isValid = await EncryptionService.comparePassword('WrongPassword', hash);

      expect(isValid).toBe(false);
    });
  });
});
