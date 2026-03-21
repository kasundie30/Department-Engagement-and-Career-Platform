import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) { }

  async upsertFromAuth0(dto: CreateUserDto): Promise<UserDocument> {
    // Match by auth0Id first; fall back to email match to handle Auth0
    // user re-creation (deleted + recreated → new sub, same email).
    // Without the $or, a duplicate unique email causes a 500 crash.
    return this.userModel.findOneAndUpdate(
      { $or: [{ auth0Id: dto.auth0Id }, { email: dto.email }] },
      { $set: { ...dto, lastActiveAt: new Date() } },
      { upsert: true, new: true },
    );
  }

  async findMe(auth0Id: string): Promise<UserDocument | null> {
    const user = await this.userModel.findOneAndUpdate(
      { auth0Id },
      { $set: { lastActiveAt: new Date() } },
      { new: true },
    );
    return user;
  }

  async updateMe(
    auth0Id: string,
    dto: UpdateUserDto,
  ): Promise<UserDocument> {
    const user = await this.userModel.findOneAndUpdate(
      { auth0Id },
      { $set: dto },
      { new: true },
    );
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findById(id: string): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user ID format');
    }
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().exec();
  }
}
