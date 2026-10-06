import type { Order } from '@/types/models';
import { formatMoney, optionalPrice } from './product-details';

const escape = (value: unknown) =>
  String(value ?? '—').replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!,
  );

// Only customer-facing values belong in a waybill, regardless of the viewer's role.
export function orderWaybillHtml(order: Order) {
  const rows = order.items
    .map(
      (item) =>
        `<tr><td>${escape(item.productName ?? item.name ?? item.productCode)}</td><td>${escape(item.color)}</td><td>${escape(item.quantity)}</td><td>${escape(formatMoney(optionalPrice(item.actualSellPriceUSD)))}</td></tr>`,
    )
    .join('');
  return `<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>بوليصة وسيط #${escape(order.orderId)}</title><style>
  @page{size:A5;margin:12mm}*{box-sizing:border-box}body{font:14px/1.8 Arial,sans-serif;color:#193c33;margin:0;padding:20px;direction:rtl}header{display:flex;justify-content:space-between;align-items:center;border-bottom:3px solid #147d64;margin-bottom:20px}h1{font-size:25px}h2{font-size:17px;margin:0}p{margin:8px 0;overflow-wrap:anywhere}table{width:100%;border-collapse:collapse;margin:20px 0}th,td{border-bottom:1px solid #dce5df;text-align:right;padding:9px;overflow-wrap:anywhere}tr{break-inside:avoid}th{background:#edf5f0}.total{font-size:19px;font-weight:bold;border-top:2px solid #147d64;padding-top:12px}.muted{color:#52645d;font-size:12px}footer{border-top:1px solid #dce5df;margin-top:24px;padding-top:12px}.print{padding:12px 20px;background:#147d64;color:white;border:0;border-radius:8px;cursor:pointer}@media print{.print{display:none}body{padding:0}}</style></head><body>
  <button class="print" onclick="window.print()">طباعة / حفظ PDF</button>
  <header><h1>وسيط</h1><div><h2>بوليصة توصيل</h2><span>#${escape(order.orderId)}</span></div></header>
  <p><b>العميل:</b> ${escape(order.customerName)}</p><p><b>الهاتف:</b> <bdi>${escape(order.customerMobile)}</bdi></p><p><b>المنطقة:</b> ${escape(order.customerArea)}</p><p><b>العنوان:</b> ${escape(order.customerAddress)}</p>
  <table><thead><tr><th>المنتج</th><th>اللون</th><th>الكمية</th><th>سعر الوحدة</th></tr></thead><tbody>${rows}</tbody></table>
  <p>رسوم التوصيل: ${escape(formatMoney(optionalPrice(order.deliveryFee)))}</p><p class="total">إجمالي الطلب: ${escape(formatMoney(optionalPrice(order.orderTotalUSD)))}</p><p class="muted">الإجمالي المسجل للطلب؛ رسوم التوصيل لا تُضاف مرة أخرى.</p>
  <footer>توقيع المستلم: __________________<p class="muted">وسيط · نسخة من بيانات الطلب المسجلة</p></footer></body></html>`;
}
