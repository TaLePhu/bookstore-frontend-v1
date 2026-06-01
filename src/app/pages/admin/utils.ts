import type { AdminOrder, AdminOrderDetail, AdminOrderStatus } from '../../services/admin.service';
import type { ApiBook } from '../../services/book.service';
import { LOW_STOCK_THRESHOLD } from './constants';

export const formatCurrency = (value: number | string | null | undefined) =>
  `${Number(value || 0).toLocaleString('vi-VN')}đ`;

export const formatDate = (value?: string | Date | null) => {
  if (!value) return 'Đang cập nhật';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Đang cập nhật' : date.toLocaleDateString('vi-VN');
};

export const getOrderStatusText = (status: AdminOrderStatus) => {
  const labels: Record<AdminOrderStatus, string> = {
    PENDING: 'Chờ xử lý',
    PROCESSING: 'Đang xử lý',
    SHIPPED: 'Đang giao',
    COMPLETED: 'Hoàn thành',
    CANCELLED: 'Đã hủy',
  };
  return labels[status] || status;
};

export const getOrderStatusColor = (status: AdminOrderStatus) => {
  const colors: Record<AdminOrderStatus, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    PROCESSING: 'bg-blue-100 text-blue-700',
    SHIPPED: 'bg-indigo-100 text-indigo-700',
    COMPLETED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
};

export const getOrderStatusPillClass = (status: AdminOrderStatus) => {
  const colors: Record<AdminOrderStatus, string> = {
    PENDING: 'bg-amber-50 text-amber-700 ring-amber-100',
    PROCESSING: 'bg-blue-50 text-blue-700 ring-blue-100',
    SHIPPED: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
    COMPLETED: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    CANCELLED: 'bg-rose-50 text-rose-700 ring-rose-100',
  };
  return colors[status] || 'bg-gray-50 text-gray-700 ring-gray-100';
};

export const getPaymentStatusPillClass = (status?: string | null) => {
  if (status === 'COMPLETED') return 'bg-emerald-50 text-emerald-700 ring-emerald-100';
  if (status === 'FAILED') return 'bg-rose-50 text-rose-700 ring-rose-100';
  if (status === 'REFUNDED') return 'bg-sky-50 text-sky-700 ring-sky-100';
  return 'bg-amber-50 text-amber-700 ring-amber-100';
};

export const getNextStatuses = (status: AdminOrderStatus): AdminOrderStatus[] => {
  const transitions: Record<AdminOrderStatus, AdminOrderStatus[]> = {
    PENDING: ['PROCESSING', 'CANCELLED'],
    PROCESSING: ['SHIPPED', 'CANCELLED'],
    SHIPPED: ['COMPLETED'],
    COMPLETED: [],
    CANCELLED: [],
  };
  return transitions[status] || [];
};

export const getOrderOperationNote = (status: AdminOrderStatus) => {
  const notes: Partial<Record<AdminOrderStatus, string>> = {
    PROCESSING: 'Nhân viên xác nhận đơn hàng',
    SHIPPED: 'Nhân viên đã đóng gói và bàn giao vận chuyển',
    COMPLETED: 'Nhân viên xác nhận giao hàng thành công',
  };
  return notes[status];
};

export const getPaymentMethodText = (method?: string) => {
  const labels: Record<string, string> = {
    COD: 'Thanh toán khi nhận hàng',
    CREDIT_CARD: 'Thẻ tín dụng',
    DEBIT_CARD: 'Thẻ ghi nợ',
    BANK_TRANSFER: 'Chuyển khoản',
    WALLET: 'Ví điện tử',
    MOMO: 'MoMo',
  };
  return labels[method || ''] || method || 'Đang cập nhật';
};

export const getPaymentStatusText = (status?: string) => {
  const labels: Record<string, string> = {
    PENDING: 'Chờ thanh toán',
    COMPLETED: 'Đã thanh toán',
    FAILED: 'Thanh toán thất bại',
    REFUNDED: 'Đã hoàn tiền',
  };
  return labels[status || ''] || status || 'Đang cập nhật';
};

const escapeHtml = (value: unknown) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

export const getOrderShippingAddress = (order: AdminOrderDetail) =>
  [
    order.address?.addressLine,
    order.address?.wardName || order.address?.ward,
    order.address?.districtName || order.address?.district,
    order.address?.provinceName || order.address?.city,
    order.address?.country,
  ]
    .filter(Boolean)
    .join(', ');

export const buildOrderPrintHtml = (order: AdminOrderDetail) => {
  const orderCode = order.orderCode || order.id.slice(0, 8);
  const receiverName =
    order.address?.receiverName ||
    order.address?.fullName ||
    order.user?.fullName ||
    order.user?.userName ||
    order.customerName ||
    'Khách hàng';
  const phone = order.address?.phone || order.customerPhone || 'Đang cập nhật';
  const address = getOrderShippingAddress(order) || 'Đang cập nhật';
  const itemRows = (order.items || [])
    .map(
      (item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(item.book?.title || 'Sách')}</td>
          <td class="number">${item.quantity}</td>
          <td class="number">${escapeHtml(formatCurrency(item.price))}</td>
          <td class="number">${escapeHtml(formatCurrency(item.subTotal))}</td>
        </tr>`
    )
    .join('');

  return `<!doctype html>
    <html lang="vi">
      <head>
        <meta charset="utf-8" />
        <title>Phiếu đóng gói ${escapeHtml(orderCode)}</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: Arial, sans-serif; color: #111827; margin: 32px; }
          h1 { font-size: 24px; margin: 0 0 4px; }
          h2 { font-size: 16px; margin: 24px 0 8px; }
          .muted { color: #6b7280; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 20px; }
          .box { border: 1px solid #d1d5db; border-radius: 8px; padding: 14px; }
          .row { margin: 6px 0; }
          table { border-collapse: collapse; width: 100%; margin-top: 12px; }
          th, td { border: 1px solid #d1d5db; padding: 10px; text-align: left; vertical-align: top; }
          th { background: #f3f4f6; }
          .number { text-align: right; white-space: nowrap; }
          .total { display: flex; justify-content: flex-end; gap: 16px; margin-top: 16px; font-size: 18px; font-weight: 700; }
          .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; margin-top: 48px; text-align: center; }
          @media print { body { margin: 20mm; } }
        </style>
      </head>
      <body>
        <h1>Phiếu đóng gói / giao hàng</h1>
        <div class="muted">Mã đơn: ${escapeHtml(orderCode)} - Ngày đặt: ${escapeHtml(formatDate(order.createdAt))}</div>

        <div class="grid">
          <div class="box">
            <h2>Thông tin khách hàng</h2>
            <div class="row"><strong>Người nhận:</strong> ${escapeHtml(receiverName)}</div>
            <div class="row"><strong>Số điện thoại:</strong> ${escapeHtml(phone)}</div>
            <div class="row"><strong>Địa chỉ:</strong> ${escapeHtml(address)}</div>
          </div>
          <div class="box">
            <h2>Thông tin xử lý</h2>
            <div class="row"><strong>Trạng thái:</strong> ${escapeHtml(getOrderStatusText(order.status))}</div>
            <div class="row"><strong>Thanh toán:</strong> ${escapeHtml(getPaymentMethodText(order.payments?.[0]?.method))}</div>
            <div class="row"><strong>Tình trạng thanh toán:</strong> ${escapeHtml(getPaymentStatusText(order.payments?.[0]?.status))}</div>
          </div>
        </div>

        <h2>Sản phẩm</h2>
        <table>
          <thead>
            <tr>
              <th>STT</th>
              <th>Tên sách</th>
              <th class="number">SL</th>
              <th class="number">Đơn giá</th>
              <th class="number">Thành tiền</th>
            </tr>
          </thead>
          <tbody>${itemRows || '<tr><td colspan="5">Không có sản phẩm</td></tr>'}</tbody>
        </table>
        <div class="total"><span>Tổng cộng</span><span>${escapeHtml(formatCurrency(order.totalAmount))}</span></div>

        <div class="signatures">
          <div><strong>Nhân viên đóng gói</strong><br /><span class="muted">(Ký, ghi rõ họ tên)</span></div>
          <div><strong>Đơn vị giao hàng / khách nhận</strong><br /><span class="muted">(Ký, ghi rõ họ tên)</span></div>
        </div>
      </body>
    </html>`;
};

export const getLatestCancelNote = (order?: AdminOrderDetail | null) =>
  [...(order?.statusLogs || [])]
    .reverse()
    .find(
      (log) =>
        (log.toStatus === 'CANCELLED' && log.note) ||
        (log.fromStatus === log.toStatus && log.note?.includes('yêu cầu hủy'))
    )?.note || '';

export const hasCustomerCancelRequest = (order?: Pick<AdminOrderDetail, 'status' | 'statusLogs'> | AdminOrder | null) =>
  Boolean(
    (order as AdminOrder)?.cancelRequested ||
      ((order?.status === 'PENDING' || order?.status === 'PROCESSING') &&
        (order as AdminOrderDetail)?.statusLogs?.some(
          (log) => log.fromStatus === log.toStatus && Boolean(log.note?.includes('yêu cầu hủy'))
        ))
  );

const isCustomerCancelRequestLog = (log: NonNullable<AdminOrderDetail['statusLogs']>[number]) =>
  log.fromStatus === log.toStatus &&
  !log.changedByUser &&
  Boolean(
    log.note?.includes('yêu cầu hủy') ||
      log.note?.includes('yêu cầu hủy') ||
      log.note?.startsWith('Khách yêu cầu hủy:') ||
      log.note?.startsWith('Khách yêu cầu hủy:')
  );

const isCancelRequestResolutionLog = (log: NonNullable<AdminOrderDetail['statusLogs']>[number]) =>
  Boolean(
    log.changedByUser &&
      (log.toStatus === 'CANCELLED' ||
        (log.fromStatus === log.toStatus &&
          (log.note?.startsWith('Admin từ chối yêu cầu hủy:') ||
            log.note?.startsWith('Admin tu choi yeu cau huy:'))))
  );

export const hasPendingCustomerCancelRequest = (
  order?: Pick<AdminOrderDetail, 'status' | 'statusLogs'> | AdminOrder | null
) => {
  if (!order || !['PENDING', 'PROCESSING'].includes(order.status)) return false;

  const statusLogs = (order as AdminOrderDetail).statusLogs;
  if (!statusLogs) return Boolean((order as AdminOrder).cancelRequested);

  const sortedLogs = [...statusLogs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const latestRequest = sortedLogs.find(isCustomerCancelRequestLog);
  const latestResolution = sortedLogs.find(isCancelRequestResolutionLog);

  return Boolean(
    latestRequest &&
      (!latestResolution ||
        new Date(latestRequest.createdAt).getTime() > new Date(latestResolution.createdAt).getTime())
  );
};

export const getOrderTaskPillClass = (order: AdminOrder | AdminOrderDetail) => {
  if (hasPendingCustomerCancelRequest(order)) return 'bg-rose-50 text-rose-700 ring-rose-100';
  const colors: Record<AdminOrderStatus, string> = {
    PENDING: 'bg-orange-50 text-orange-700 ring-orange-100',
    PROCESSING: 'bg-blue-50 text-blue-700 ring-blue-100',
    SHIPPED: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
    COMPLETED: 'bg-gray-50 text-gray-600 ring-gray-100',
    CANCELLED: 'bg-gray-50 text-gray-600 ring-gray-100',
  };
  return colors[order.status] || 'bg-gray-50 text-gray-600 ring-gray-100';
};

export const getOrderTaskText = (order: AdminOrder | AdminOrderDetail) => {
  if (hasPendingCustomerCancelRequest(order)) return 'Chờ xử lý hủy';
  const labels: Record<AdminOrderStatus, string> = {
    PENDING: 'Cần xác nhận',
    PROCESSING: 'Cần đóng gói',
    SHIPPED: 'Đang giao khách',
    COMPLETED: 'Không cần thao tác',
    CANCELLED: 'Đã hủy',
  };
  return labels[order.status] || 'Không cần thao tác';
};

export const getBookStatusMeta = (book: ApiBook) => {
  const stock = Number(book.stock || 0);

  if (book.deletedAt || book.status === 'deleted') {
    return {
      label: 'Đã xóa mềm',
      dot: 'bg-gray-400',
      className: 'bg-gray-100 text-gray-700 ring-gray-200',
    };
  }

  if (stock <= 0) {
    return {
      label: 'Hết hàng',
      dot: 'bg-red-500',
      className: 'bg-red-50 text-red-700 ring-red-100',
    };
  }

  if (stock <= LOW_STOCK_THRESHOLD) {
    return {
      label: 'Sắp hết hàng',
      dot: 'bg-amber-500',
      className: 'bg-amber-50 text-amber-700 ring-amber-100',
    };
  }

  return {
    label: 'Còn hàng',
    dot: 'bg-emerald-500',
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  };
};
