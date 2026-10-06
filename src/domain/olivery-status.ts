// Provider titles are aliases, never new local order transitions or financial commands.
export const OLIVERY_TITLES: Record<string, string> = {
  waiting_printed: 'بالانتظار مطبوع',
  waiting: 'بالانتظار',
  picking_up: 'جاري استلام الشحنة من التاجر',
  picked_up: 'تم استلام الشحنة من التاجر',
  in_branch: 'بالشركة',
  ready_for_dispatch: 'جاهز للتوزيع',
  to_branch: 'نقل إلى فرع آخر',
  in_progress: 'جاري التوصيل',
  delivered: 'تم التسليم',
  rejected: 'مرفوض',
  reschedule: 'مؤجل',
  stuck: 'عالق',
  replacement: 'تبديل',
  confirm_branch: 'تم التأكيد من الفرع',
  money_received: 'تم استلام المال في الفرع',
  money_in: 'تم استلام ومعالجة المال',
  money_out: 'جاري تسليم المال للتاجر',
  paid: 'مدفوع للتاجر',
  completed: 'مكتمل',
  branch_returned: 'مرجع للفرع',
  ready_for_return: 'مرجع معالج',
  returned_in_progress: 'جاري تسليم المرجع للتاجر',
  returned_delivered: 'تم تسليم المرجع للتاجر',
  completed_returned: 'مكتمل راجع',
  canceled: 'ملغي',
  deleted: 'محذوف',
  delivered_with_return: 'تم التسليم ويوجد مرتجع',
  // Separate provider vocabulary used by the edit window, not waiting_printed.
  printing_waiting: 'بانتظار الطباعة',
};
export function oliveryTitleCode(value: string): string | undefined {
  const text = value.trim();
  return Object.entries(OLIVERY_TITLES).find(([, title]) => title === text)?.[0];
}
