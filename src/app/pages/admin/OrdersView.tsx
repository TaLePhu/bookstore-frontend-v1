import type React from 'react';
import type {
  AdminOrder,
  AdminPaymentMethod,
  AdminPaymentStatus,
  AdminOrderStatus,
} from '../../services/admin.service';
import { ORDER_PAYMENT_METHOD_OPTIONS, ORDER_PAYMENT_STATUS_OPTIONS } from './constants';
import { EmptyState, SearchBox, TableCell, TableHead } from './components';
import type { OrderAction, OrderWorkflowTab } from './types';
import {
  formatCurrency,
  formatDate,
  getOrderStatusPillClass,
  getOrderStatusText,
  getOrderTaskPillClass,
  getOrderTaskText,
  getPaymentMethodText,
  getPaymentStatusPillClass,
  getPaymentStatusText,
  hasPendingCustomerCancelRequest,
} from './utils';

type OrderWorkflowTabItem = {
  id: OrderWorkflowTab;
  label: string;
  count: number;
  status?: AdminOrderStatus;
};

type OrdersViewProps = {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  orderWorkflowTabs: OrderWorkflowTabItem[];
  orderWorkflowTab: OrderWorkflowTab;
  goToOrderWorkflowTab: (tab: OrderWorkflowTab) => void;
  orderPaymentMethodFilter: 'all' | AdminPaymentMethod;
  setOrderPaymentMethodFilter: (value: 'all' | AdminPaymentMethod) => void;
  orderPaymentStatusFilter: 'all' | AdminPaymentStatus;
  setOrderPaymentStatusFilter: (value: 'all' | AdminPaymentStatus) => void;
  orderDateFrom: string;
  setOrderDateFrom: (value: string) => void;
  orderDateTo: string;
  setOrderDateTo: (value: string) => void;
  clearOrderFilters: () => void;
  filteredOrders: AdminOrder[];
  orders: AdminOrder[];
  getOrderActions: (order: AdminOrder, placement: 'table') => OrderAction[];
  renderOrderActionButton: (order: AdminOrder, action: OrderAction) => React.ReactNode;
  orderTotal: number;
  showCancelRequestsOnly: boolean;
  orderCurrentPage: number;
  totalOrderPages: number;
  setOrderCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  isLoading: boolean;
};

export function OrdersView({
  searchQuery,
  setSearchQuery,
  orderWorkflowTabs,
  orderWorkflowTab,
  goToOrderWorkflowTab,
  orderPaymentMethodFilter,
  setOrderPaymentMethodFilter,
  orderPaymentStatusFilter,
  setOrderPaymentStatusFilter,
  orderDateFrom,
  setOrderDateFrom,
  orderDateTo,
  setOrderDateTo,
  clearOrderFilters,
  filteredOrders,
  orders,
  getOrderActions,
  renderOrderActionButton,
  orderTotal,
  showCancelRequestsOnly,
  orderCurrentPage,
  totalOrderPages,
  setOrderCurrentPage,
  isLoading,
}: OrdersViewProps) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {orderWorkflowTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => goToOrderWorkflowTab(tab.id)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                orderWorkflowTab === tab.id
                  ? 'bg-orange-500 text-white'
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.label}
              <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                orderWorkflowTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
              }`}>
                {tab.count.toLocaleString('vi-VN')}
              </span>
            </button>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[1.4fr_0.9fr_0.9fr_0.8fr_auto]">
          <SearchBox value={searchQuery} onChange={setSearchQuery} placeholder="Tìm mã đơn, SĐT, tên khách..." />
          <select
            value={orderPaymentMethodFilter}
            onChange={(event) => setOrderPaymentMethodFilter(event.target.value as 'all' | AdminPaymentMethod)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">Tất cả thanh toán</option>
            {ORDER_PAYMENT_METHOD_OPTIONS.map((method) => (
              <option key={method} value={method}>{getPaymentMethodText(method)}</option>
            ))}
          </select>
          <select
            value={orderPaymentStatusFilter}
            onChange={(event) => setOrderPaymentStatusFilter(event.target.value as 'all' | AdminPaymentStatus)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">Tất cả trạng thái TT</option>
            {ORDER_PAYMENT_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>{getPaymentStatusText(status)}</option>
            ))}
          </select>
          <input
            type="date"
            value={orderDateFrom}
            onChange={(event) => setOrderDateFrom(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <div className="flex gap-2">
            <input
              type="date"
              value={orderDateTo}
              onChange={(event) => setOrderDateTo(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button
              type="button"
              onClick={clearOrderFilters}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              Xóa lọc
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px]">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <TableHead className="w-[190px]">Đơn hàng</TableHead>
                <TableHead className="w-[330px]">Khách & giao hàng</TableHead>
                <TableHead className="w-[210px]">Thanh toán</TableHead>
                <TableHead className="w-[220px]">Trạng thái</TableHead>
                <TableHead align="right" className="w-[220px]">Thao tác</TableHead>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="transition-colors hover:bg-orange-50/30">
                  <TableCell className="py-5">
                    <div className="space-y-2">
                      <p className="font-semibold text-gray-950">{order.orderCode || order.id.slice(0, 8)}</p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                        <span>{formatDate(order.createdAt)}</span>
                        <span className="h-1 w-1 rounded-full bg-gray-300" />
                        <span>{order.totalItems || 0} SP</span>
                      </div>
                      {hasPendingCustomerCancelRequest(order) && (
                        <span className="inline-flex w-fit rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-100">
                          Khách yêu cầu hủy
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-5">
                    <div className="space-y-1.5">
                      <p className="font-semibold text-gray-900">{order.customerName || 'Khách hàng'}</p>
                      <p className="text-sm text-gray-500">{order.customerEmail || 'Chưa có email'}</p>
                      {order.customerPhone && <p className="text-sm font-medium text-gray-700">{order.customerPhone}</p>}
                      <p className="line-clamp-2 max-w-md text-sm leading-6 text-gray-600">{order.addressSummary || 'Đang cập nhật địa chỉ'}</p>
                    </div>
                  </TableCell>
                  <TableCell className="py-5">
                    <div className="space-y-2">
                      <p className="text-base font-bold text-gray-950">{formatCurrency(order.totalAmount)}</p>
                      <p className="text-sm font-medium text-gray-800">{getPaymentMethodText(order.paymentMethod || undefined)}</p>
                      <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${getPaymentStatusPillClass(order.paymentStatus)}`}>
                        {getPaymentStatusText(order.paymentStatus || undefined)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-5">
                    <div className="space-y-2">
                      <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${getOrderStatusPillClass(order.status)}`}>
                        {getOrderStatusText(order.status)}
                      </span>
                      <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${getOrderTaskPillClass(order)}`}>
                        {getOrderTaskText(order)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell align="right" className="py-5">
                    <div className="flex flex-col items-end gap-2">
                      {getOrderActions(order, 'table').map((action) => renderOrderActionButton(order, action))}
                    </div>
                  </TableCell>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredOrders.length === 0 && <EmptyState text="Không có đơn hàng phù hợp." />}
        {orderTotal > 0 && (
          <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-gray-500">
              {showCancelRequestsOnly
                ? `Trang ${orderCurrentPage}/${totalOrderPages} • Hiển thị ${filteredOrders.length} đơn phù hợp trong trang hiện tại`
                : `Trang ${orderCurrentPage}/${totalOrderPages} • Hiển thị ${orders.length} / ${orderTotal} đơn`}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setOrderCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={orderCurrentPage === 1 || isLoading}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Trước
              </button>
              {Array.from({ length: totalOrderPages }, (_, index) => index + 1)
                .slice(Math.max(0, orderCurrentPage - 3), Math.max(5, Math.min(totalOrderPages, orderCurrentPage + 2)))
                .map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setOrderCurrentPage(page)}
                    disabled={isLoading}
                    className={`h-9 min-w-9 rounded-lg px-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                      page === orderCurrentPage
                        ? 'bg-orange-500 text-white'
                        : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              <button
                type="button"
                onClick={() => setOrderCurrentPage((prev) => Math.min(totalOrderPages, prev + 1))}
                disabled={orderCurrentPage === totalOrderPages || isLoading}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
