import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class RequestOtpDto {
  @IsNotEmpty({ message: 'رقم الهاتف مطلوب' })
  @IsString()
  @Matches(/^09\d{8}$/, { message: 'يرجى إدخال رقم هاتف صحيح (مثال: 0912345678)' })
  phone: string;
}
