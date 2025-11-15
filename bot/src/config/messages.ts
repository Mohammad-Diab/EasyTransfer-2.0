export const MESSAGES = {
  UNAUTHORIZED: 'عذراً، لا تملك صلاحية استخدام هذا البوت.',
  REQUEST_RECEIVED: 'تم استلام طلبك، وسيتم تنفيذ التحويل قريباً.',
  INVALID_FORMAT: 'يرجى استخدام الصيغة: /send <amount> <phone>',
  BACKEND_ERROR: 'حدث خطأ أثناء إرسال الطلب. يرجى المحاولة لاحقاً.',
  ERROR: 'حدث خطأ. يرجى المحاولة مرة أخرى.',
  TRANSFER_SUCCESS: (id: number) => `✅ تم تنفيذ عملية التحويل (ID: ${id}) بنجاح.`,
  TRANSFER_FAILED: (id: number, reason: string) =>
    `❌ فشلت عملية التحويل (ID: ${id}). السبب: ${reason}`,
  
  // Interactive send mode
  ASK_PHONE: 'يرجى إدخال رقم الهاتف المستلم:',
  ASK_AMOUNT: 'يرجى إدخال المبلغ المراد تحويله:',
  INVALID_PHONE: 'رقم الهاتف غير صالح. يرجى إدخال أرقام فقط.',
  INVALID_AMOUNT: 'المبلغ غير صالح. يرجى إدخال رقم موجب.',
};
