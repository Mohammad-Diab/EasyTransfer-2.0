import { IsOptional, IsString, IsIn } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  @IsIn(['USER', 'ADMIN', 'DEVICE'], { message: 'الدور يجب أن يكون USER أو ADMIN أو DEVICE' })
  role?: string;
}
