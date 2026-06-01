import type React from 'react';
import { AlertCircle, ClipboardCheck, Copy, Printer, X } from 'lucide-react';
import type { AdminOrderDetail } from '../../services/admin.service';
import { InfoBlock, TableCell, TableHead } from './components';
import type { OrderAction } from './types';
import {
  formatCurrency,
  formatDate,
  getLatestCancelNote,
  getNextStatuses,
  getOrderShippingAddress,
  getOrderStatusText,
  getPaymentMethodText,
  getPaymentStatusText,
  hasPendingCustomerCancelRequest,
} from './utils';

type OrderDetailModalProps = {
  selectedOrder: AdminOrderDetail;
  orderInternalNote: string;
  setOrderInternalNote: (value: string) => void;
  closeOrderDetail: () => void;
  handlePrintOrder: (order: AdminOrderDetail) => void;
  handleCopyText: (value?: string | null, label?: string) => Promise<void>;
  getOrderActions: (order: AdminOrderDetail, placement: 'modal') => OrderAction[];
  renderOrderActionButton: (order: AdminOrderDetail, action: OrderAction) => React.ReactNode;
};

export function OrderDetailModal({
  selectedOrder,
  orderInternalNote,
  setOrderInternalNote,
  closeOrderDetail,
  handlePrintOrder,
  handleCopyText,
  getOrderActions,
  renderOrderActionButton,
}: OrderDetailModalProps) {
  const orderActions = getOrderActions(selectedOrder, 'modal');
  const operationActions = orderActions.filter((action) => action.group === 'operation');
  const cancelActions = orderActions.filter((action) => action.group === 'cancel');
  const shippingAddress = getOrderShippingAddress(selectedOrder);
  const latestCancelNote = getLatestCancelNote(selectedOrder);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-800">
            Chi tiết đơn {selectedOrder.orderCode || selectedOrder.id.slice(0, 8)}
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handlePrintOrder(selectedOrder)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Printer className="h-4 w-4" />
              In phiếu
            </button>
            <button
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={closeOrderDetail}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <InfoBlock
              title="Thông tin đơn hàng"
              rows={[
                ['Mã đơn', selectedOrder.orderCode || selectedOrder.id],
                ['Ngày đặt', formatDate(selectedOrder.createdAt)],
                ['Trạng thái', getOrderStatusText(selectedOrder.status)],
              ]}
            />
            <InfoBlock
              title="Thông tin khách hàng"
              rows={[
                ['Họ tên', selectedOrder.user?.fullName || selectedOrder.user?.userName || 'Khách hàng'],
                ['Email', selectedOrder.user?.email || 'Đang cập nhật'],
                ['Số điện thoại', selectedOrder.address?.phone || 'Đang cập nhật'],
              ]}
            />
          </div>

          <div className="flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-white p-4">
            <button
              type="button"
              onClick={() => handleCopyText(selectedOrder.address?.phone || selectedOrder.customerPhone, 'SĐT')}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Copy className="h-4 w-4" />
              Copy SĐT
            </button>
            <button
              type="button"
              onClick={() => handleCopyText(shippingAddress, 'địa chỉ')}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Copy className="h-4 w-4" />
              Copy địa chỉ
            </button>
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-2">Địa chỉ giao hàng</h4>
            <p className="text-gray-800">{shippingAddress || 'Đang cập nhật'}</p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <InfoBlock
              title="Thanh toán"
              rows={[
                ['Phương thức', getPaymentMethodText(selectedOrder.payments?.[0]?.method)],
                ['Trạng thái', getPaymentStatusText(selectedOrder.payments?.[0]?.status)],
                ['Số tiền', formatCurrency(selectedOrder.payments?.[0]?.amount || selectedOrder.totalAmount)],
              ]}
            />
            <InfoBlock
              title="Xử lý đơn"
              rows={[
                ['Cập nhật lần cuối', formatDate(selectedOrder.updatedAt)],
                ['Bước tiếp theo', getNextStatuses(selectedOrder.status).map(getOrderStatusText).join(', ') || 'Không còn thao tác'],
              ]}
            />
          </div>

          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-3">Sản phẩm</h4>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full min-w-[640px]">
                <thead className="bg-gray-50">
                  <tr>
                    <TableHead>Tên sách</TableHead>
                    <TableHead align="right">Tồn kho</TableHead>
                    <TableHead align="right">Số lượng</TableHead>
                    <TableHead align="right">Đơn giá</TableHead>
                    <TableHead align="right">Thành tiền</TableHead>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {(selectedOrder.items || []).map((item) => (
                    <tr key={item.id}>
                      <TableCell>{item.book?.title || 'Sách'}</TableCell>
                      <TableCell align="right">
                        <span className={item.book?.stock !== undefined && Number(item.book.stock) < Number(item.quantity || 0) ? 'font-semibold text-red-600' : 'text-gray-700'}>
                          {item.book?.stock ?? 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell align="right">{formatCurrency(item.price)}</TableCell>
                      <TableCell align="right">{formatCurrency(item.subTotal)}</TableCell>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {(selectedOrder.items || []).some((item) => item.book?.stock !== undefined && Number(item.book.stock) < Number(item.quantity || 0)) && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                Có sản phẩm không đủ tồn kho so với số lượng khách đặt.
              </div>
            )}
          </div>

          {selectedOrder.status === 'PROCESSING' && (
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <h4 className="mb-3 flex items-center gap-2 font-medium text-gray-800">
                <ClipboardCheck className="h-5 w-5 text-orange-500" />
                Checklist đóng gói
              </h4>
              <div className="grid gap-2 md:grid-cols-2">
                {['Đã kiểm tra đúng sách', 'Đã kiểm tra số lượng', 'Đã đóng gói', 'Đã in phiếu'].map((label) => (
                  <label key={label} className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
                    <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500" />
                    {label}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-gray-200 pt-4 flex items-center justify-between">
            <span className="text-lg font-medium text-gray-600">Tổng cộng</span>
            <span className="text-2xl font-bold text-orange-500">{formatCurrency(selectedOrder.totalAmount)}</span>
          </div>

          {operationActions.length > 0 && (
            <div className="rounded-xl border border-orange-100 bg-orange-50 p-4">
              <div className="mb-3">
                <h4 className="font-semibold text-gray-900">Xử lý vận hành</h4>
                <p className="mt-1 text-sm text-gray-600">
                  Trạng thái hiện tại: {getOrderStatusText(selectedOrder.status)}. Bước tiếp theo:{' '}
                  {getNextStatuses(selectedOrder.status)
                    .filter((status) => status !== 'CANCELLED')
                    .map(getOrderStatusText)
                    .join(', ') || 'Không còn thao tác'}
                </p>
              </div>
              <label className="mb-3 block">
                <span className="mb-1 block text-sm font-medium text-gray-600">Ghi chú nội bộ</span>
                <textarea
                  value={orderInternalNote}
                  onChange={(event) => setOrderInternalNote(event.target.value)}
                  rows={3}
                  maxLength={500}
                  placeholder="Ví dụ: Đã gọi xác nhận, khách hẹn giao buổi chiều..."
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                {operationActions.map((action) => renderOrderActionButton(selectedOrder, action))}
              </div>
            </div>
          )}

          {cancelActions.length > 0 && (
            <div className="rounded-xl border border-red-100 bg-red-50 p-4">
              <div className="mb-3">
                <h4 className="font-semibold text-red-900">Xử lý hủy</h4>
                <p className="mt-1 text-sm leading-6 text-red-700">
                  {hasPendingCustomerCancelRequest(selectedOrder)
                    ? latestCancelNote || 'Khách đã gửi yêu cầu hủy đơn hàng này.'
                    : 'Admin có thể hủy thủ công đơn chưa chuyển sang giao hàng.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {cancelActions.map((action) => renderOrderActionButton(selectedOrder, action))}
              </div>
            </div>
          )}

          {selectedOrder.status === 'CANCELLED' && latestCancelNote && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                <div>
                  <h4 className="font-semibold text-red-800">Lý do hủy đơn</h4>
                  <p className="mt-1 text-sm leading-6 text-red-700">{latestCancelNote}</p>
                </div>
              </div>
            </div>
          )}

          {(selectedOrder.statusLogs || []).length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <h4 className="font-medium text-gray-800 mb-4">Lịch sử xử lý</h4>
              <div className="space-y-3">
                {[...(selectedOrder.statusLogs || [])]
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((log) => (
                    <div key={log.id} className="rounded-lg bg-gray-50 p-3">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-sm font-semibold text-gray-800">
                          {getOrderStatusText(log.fromStatus)} → {getOrderStatusText(log.toStatus)}
                        </div>
                        <div className="text-xs text-gray-500">{formatDate(log.createdAt)}</div>
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        Người cập nhật:{' '}
                        {log.changedByUser?.fullName || log.changedByUser?.userName || log.changedByUser?.email || 'Khách hàng / hệ thống'}
                      </div>
                      {log.note && <p className="mt-2 text-sm leading-6 text-gray-700">{log.note}</p>}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
