import { IsNotEmpty, IsString, IsNumber, Min, Max, Matches } from 'class-validator';

export class CreateTransferDto {
  @IsNotEmpty({ message: 'رقم الهاتف مطلوب' })
  @IsString()
  @Matches(/^09\d{8}$/, { message: 'يرجى إدخال رقم هاتف صحيح (مثال: 0912345678)' })
  recipient_phone: string;

  @IsNotEmpty({ message: 'المبلغ مطلوب' })
  @IsNumber({}, { message: 'يجب أن يكون المبلغ رقماً' })
  @Min(1, { message: 'يجب أن يكون المبلغ أكبر من صفر' })
  @Max(100000, { message: 'المبلغ المطلوب يتجاوز الحد الأقصى المسموح (100,000)' })
  amount: number;
}
