import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getModelToken } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import { NotFoundException } from '@nestjs/common';

const mockUserModel = {
  findOneAndUpdate: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn(),
  find: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getModelToken(User.name), useValue: mockUserModel },
      ],
    }).compile();
    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('findMe', () => {
    it('should return user when found', async () => {
      mockUserModel.findOneAndUpdate.mockResolvedValue({
        auth0Id: 'auth0-123',
        email: 'a@b.com',
      });
      const result = await service.findMe('auth0-123');
      expect(result).toHaveProperty('email', 'a@b.com');
    });

    it('should return null when user not found', async () => {
      mockUserModel.findOneAndUpdate.mockResolvedValue(null);
      const result = await service.findMe('bad-id');
      expect(result).toBeNull();
    });
  });

  describe('updateMe', () => {
    it('should update and return user', async () => {
      mockUserModel.findOneAndUpdate.mockResolvedValue({ name: 'Updated' });
      const result = await service.updateMe('auth0-123', { name: 'Updated' });
      expect(result.name).toBe('Updated');
    });

    it('should throw NotFoundException when user to update not found', async () => {
      mockUserModel.findOneAndUpdate.mockResolvedValue(null);
      await expect(service.updateMe('bad-id', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('should return list of users', async () => {
      mockUserModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue([{ email: 'a@b.com' }]),
      });
      const result = await service.findAll();
      expect(result).toHaveLength(1);
    });
  });
});
