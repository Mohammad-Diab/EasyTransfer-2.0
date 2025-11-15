import { IsNotEmpty, IsString, IsOptional, Length, Matches } from 'class-validator';

export class VerifyAndroidOtpDto {
  @IsNotEmpty({ message: 'رقم الهاتف مطلوب' })
  @IsString()
  @Matches(/^09\d{8}$/, { message: 'يرجى إدخال رقم هاتف صحيح' })
  phone: string;

  @IsNotEmpty({ message: 'رمز التحقق مطلوب' })
  @IsString()
  @Length(6, 6, { message: 'رمز التحقق يجب أن يكون 6 أرقام' })
  code: string;

  @IsNotEmpty({ message: 'معرّف الجهاز مطلوب' })
  @IsString()
  device_id: string;

  @IsOptional()
  @IsString()
  device_name?: string;
}
