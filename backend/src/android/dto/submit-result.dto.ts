import { IsNotEmpty, IsString, IsIn } from 'class-validator';

export class SubmitResultDto {
  @IsNotEmpty({ message: 'الحالة مطلوبة' })
  @IsString()
  @IsIn(['success', 'failed'], { message: 'الحالة يجب أن تكون success أو failed' })
  status: 'success' | 'failed';

  @IsNotEmpty({ message: 'رسالة الشركة مطلوبة' })
  @IsString()
  carrier_response: string;
}
