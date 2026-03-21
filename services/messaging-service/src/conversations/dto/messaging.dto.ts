import { IsString, IsNotEmpty, IsArray, IsOptional, MinLength } from 'class-validator';

export class CreateDMDto {
  @IsString()
  @IsNotEmpty()
  targetUserId: string;
}

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  name: string;

  @IsArray()
  @IsString({ each: true })
  participants: string[];
}

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  content: string;
}

export class PaginationDto {
  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}
