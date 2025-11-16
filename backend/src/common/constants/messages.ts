export const MESSAGES = {
  // Authentication & Authorization
  UNAUTHORIZED: 'عذراً، لا تملك صلاحية استخدام هذا البوت.',
  ACCOUNT_DISABLED: 'حسابك معطل يرجى التواصل مع مدير النظام',
  
  // User Management
  USER_NOT_FOUND: 'المستخدم غير موجود',
  USER_ALREADY_EXISTS: 'هذا المستخدم مسجل بالفعل في النظام',
  USER_ALREADY_REGISTERED: 'هذا المستخدم مسجل بالفعل',
  PHONE_ALREADY_EXISTS: 'رقم الهاتف مستخدم بالفعل',
  CANNOT_DISABLE_ADMIN: 'لا يمكن تعطيل حساب المدير',
  
  // OTP
  OTP_SENT_SUCCESS: 'تم إرسال رمز التحقق بنجاح',
  OTP_SEND_FAILED: 'فشل إرسال رمز التحقق. تأكد من أنك بدأت محادثة مع البوت.',
  OTP_INVALID_OR_EXPIRED: 'رمز التحقق غير صحيح أو منتهي الصلاحية',
  
  // Transfers
  TRANSFER_NOT_FOUND: 'طلب التحويل غير موجود',
  AMOUNT_NOT_ALLOWED: 'لا يمكن تحويل هذا المبلغ',
  
  // Balance
  BALANCE_TIMEOUT: 'انتهاء المهلة. لم يتم استلام أي رد خلال 60 ثانية.',
} as const;
