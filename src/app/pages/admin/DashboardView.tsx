import type { ComponentType, ReactNode } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ApiBook } from '../../services/book.service';
import type { AdminDashboardResponse, AdminOrder, AdminPromotion } from '../../services/admin.service';
import { COLORS } from './constants';
import { EmptyState } from './components';
import type { BookStockFilter, OrderAction } from './types';
import {
  formatCurrency,
  formatDate,
  getOrderStatusPillClass,
  getOrderStatusText,
  getOrderTaskPillClass,
  getOrderTaskText,
} from './utils';

type IconComponent = ComponentType<{ className?: string }>;

type WorkCard = {
  id: string;
  title: string;
  value: number;
  helper: string;
  className: string;
  iconClassName: string;
  icon: IconComponent;
  onClick: () => void;
};

type KpiCard = {
  id: string;
  title: string;
  value: string;
  helper: string;
  className: string;
  iconClassName: string;
  icon: IconComponent;
  onClick?: () => void;
};

type ActionItem = {
  id: string;
  label: string;
  helper: string;
  actionLabel: string;
  onClick: () => void;
};

type HealthMetric = {
  label: string;
  value: string;
};

type OrderStatusChartItem = {
  status: string;
  label: string;
  count: number;
};

type DashboardViewProps = {
  isAdmin: boolean;
  dashboard: AdminDashboardResponse | null;
  staffWorkCards: WorkCard[];
  staffPriorityOrders: AdminOrder[];
  stockAlertBooks: ApiBook[];
  staffActivePromotions: AdminPromotion[];
  adminKpiCards: KpiCard[];
  adminActionItems: ActionItem[];
  adminOrderStatusChartData: OrderStatusChartItem[];
  adminHealthMetrics: HealthMetric[];
  goToOrders: () => void;
  goToStockAlerts: (filter?: BookStockFilter) => void;
  openOrderDetail: (order: AdminOrder) => void;
  openBookDetail: (book: ApiBook, mode: 'detail') => void;
  openPromotionsView: () => void;
  getOrderActions: (order: AdminOrder, placement: 'table') => OrderAction[];
  renderOrderActionButton: (order: AdminOrder, action: OrderAction) => ReactNode;
  getPromotionRemainingText: (promotion: AdminPromotion) => string;
};

export function DashboardView({
  isAdmin,
  dashboard,
  staffWorkCards,
  staffPriorityOrders,
  stockAlertBooks,
  staffActivePromotions,
  adminKpiCards,
  adminActionItems,
  adminOrderStatusChartData,
  adminHealthMetrics,
  goToOrders,
  goToStockAlerts,
  openOrderDetail,
  openBookDetail,
  openPromotionsView,
  getOrderActions,
  renderOrderActionButton,
  getPromotionRemainingText,
}: DashboardViewProps) {
  const revenueChartData = (dashboard?.revenueData || []).map((item) => ({
    ...item,
    revenueMillions: Number(item.revenue || 0) / 1_000_000,
  }));

  return (
    <div className="space-y-6">
      {!isAdmin && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-950">Bảng làm việc hôm nay</h2>
                <p className="mt-1 text-sm text-gray-500">Tập trung vào đơn cần xử lý, tồn kho và khuyến mãi đang chạy.</p>
              </div>
              <button
                type="button"
                onClick={goToOrders}
                className="w-fit rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
              >
                Mở đơn hàng
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {staffWorkCards.map((card) => {
              const Icon = card.icon;
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={card.onClick}
                  className={`rounded-2xl border p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${card.className}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{card.title}</p>
                      <p className="mt-2 text-3xl font-bold">{card.value.toLocaleString('vi-VN')}</p>
                    </div>
                    <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.iconClassName}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>
                  <p className="mt-3 text-sm opacity-80">{card.helper}</p>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.9fr]">
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Hàng đợi xử lý đơn</h3>
                  <p className="text-sm text-gray-500">Ưu tiên yêu cầu hủy, đơn mới, đóng gói và đang giao lâu nhất.</p>
                </div>
                <button type="button" onClick={goToOrders} className="text-sm font-semibold text-orange-600 hover:text-orange-700">
                  Xem tất cả
                </button>
              </div>
              <div className="divide-y divide-gray-100">
                {staffPriorityOrders.slice(0, 8).map((order) => {
                  const actions = getOrderActions(order, 'table').filter((action) => action.key !== 'view').slice(0, 2);
                  return (
                    <div key={order.id} className="grid gap-4 px-6 py-4 lg:grid-cols-[1fr_auto] lg:items-center">
                      <button type="button" onClick={() => openOrderDetail(order)} className="min-w-0 text-left">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-gray-950">{order.orderCode || order.id.slice(0, 8)}</span>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${getOrderTaskPillClass(order)}`}>
                            {getOrderTaskText(order)}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gray-600">
                          {order.customerName || 'Khách hàng'}{order.customerPhone ? ` - ${order.customerPhone}` : ''}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">{formatDate(order.createdAt)} · {formatCurrency(order.totalAmount)}</p>
                      </button>
                      <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
                        {actions.map((action) => renderOrderActionButton(order, action))}
                        {renderOrderActionButton(order, { key: 'view', label: 'Xem chi tiết', group: 'view', variant: 'icon' })}
                      </div>
                    </div>
                  );
                })}
                {staffPriorityOrders.length === 0 && <EmptyState text="Không có đơn ưu tiên cần xử lý." />}
              </div>
            </div>

            <div className="space-y-6">
              <StockAlertsCard
                stockAlertBooks={stockAlertBooks}
                openBookDetail={openBookDetail}
                onViewAll={() => goToStockAlerts('all')}
              />
              <ActivePromotionsCard
                promotions={staffActivePromotions.slice(0, 4)}
                onViewPromotions={openPromotionsView}
                getPromotionRemainingText={getPromotionRemainingText}
              />
            </div>
          </div>
        </div>
      )}

      {isAdmin && (
        <>
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-950">Tổng quan điều hành</h2>
                <p className="mt-1 text-sm text-gray-500">Theo dõi doanh thu, tồn kho, đơn hàng và các việc cần xử lý trong ngày.</p>
              </div>
              <button
                type="button"
                onClick={goToOrders}
                className="w-fit rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
              >
                Mở quản lý đơn
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            {adminKpiCards.map((card) => {
              const Icon = card.icon;
              const content = (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{card.title}</p>
                      <p className="mt-2 text-2xl font-bold">{card.value}</p>
                    </div>
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.iconClassName}`}>
                      <Icon className="h-5 w-5" />
                    </span>
                  </div>
                  <p className="mt-3 text-xs font-medium opacity-80">{card.helper}</p>
                </>
              );

              return card.onClick ? (
                <button
                  key={card.id}
                  type="button"
                  onClick={card.onClick}
                  className={`rounded-2xl border p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${card.className}`}
                >
                  {content}
                </button>
              ) : (
                <div key={card.id} className={`rounded-2xl border p-5 shadow-sm ${card.className}`}>
                  {content}
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.4fr]">
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-6 py-4">
                <h3 className="text-lg font-bold text-gray-900">Việc cần xử lý</h3>
                <p className="text-sm text-gray-500">Các việc ảnh hưởng trực tiếp đến vận hành cửa hàng.</p>
              </div>
              <div className="divide-y divide-gray-100">
                {adminActionItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 px-6 py-4">
                    <div>
                      <p className="font-semibold text-gray-950">{item.label}</p>
                      <p className="mt-1 text-sm text-gray-500">{item.helper}</p>
                    </div>
                    <button
                      type="button"
                      onClick={item.onClick}
                      className="shrink-0 rounded-lg bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-700 ring-1 ring-orange-100 transition-colors hover:bg-orange-100"
                    >
                      {item.actionLabel}
                    </button>
                  </div>
                ))}
                {adminActionItems.length === 0 && <EmptyState text="Không có việc cần xử lý ngay." />}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[1fr_0.55fr]">
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900">Doanh thu theo tháng</h3>
                <p className="mt-1 text-sm text-gray-500">Đơn vị: triệu đồng, chỉ tính đơn hoàn thành.</p>
                <div className="mt-6">
                  <ResponsiveContainer width="100%" height={290}>
                    <LineChart data={revenueChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" tickFormatter={(value) => `${Number(value).toLocaleString('vi-VN')}`} />
                      <Tooltip formatter={(value) => [formatCurrency(Number(value) * 1_000_000), 'Doanh thu']} />
                      <Legend />
                      <Line type="monotone" dataKey="revenueMillions" stroke="#F97316" strokeWidth={3} name="Doanh thu" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900">Chỉ số vận hành</h3>
                <div className="mt-5 space-y-3">
                  {adminHealthMetrics.map((metric) => (
                    <div key={metric.label} className="rounded-xl bg-gray-50 px-4 py-3">
                      <p className="text-xs font-medium text-gray-500">{metric.label}</p>
                      <p className="mt-1 text-xl font-bold text-gray-950">{metric.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_0.8fr]">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900">Đơn theo trạng thái</h3>
              <p className="mt-1 text-sm text-gray-500">Backlog vận hành theo từng bước xử lý.</p>
              <div className="mt-6">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={adminOrderStatusChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="label" stroke="#9CA3AF" />
                    <YAxis allowDecimals={false} stroke="#9CA3AF" />
                    <Tooltip />
                    <Bar dataKey="count" fill="#F97316" name="Số đơn" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-900">Phân bổ danh mục</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={dashboard?.categoryData || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {(dashboard?.categoryData || []).map((entry, index) => (
                      <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {(dashboard?.categoryData || []).slice(0, 5).map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-sm text-gray-600">{item.name}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-800">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <RecentOrdersCard dashboard={dashboard} goToOrders={goToOrders} openOrderDetail={openOrderDetail} />
            <LowStockCard stockAlertBooks={stockAlertBooks} openBookDetail={openBookDetail} onViewLowStock={() => goToStockAlerts('low_stock')} />
            <ActivePromotionsList
              promotions={staffActivePromotions.slice(0, 5)}
              onViewPromotions={openPromotionsView}
              getPromotionRemainingText={getPromotionRemainingText}
            />
          </div>
        </>
      )}
    </div>
  );
}

function StockAlertsCard({
  stockAlertBooks,
  openBookDetail,
  onViewAll,
}: {
  stockAlertBooks: ApiBook[];
  openBookDetail: (book: ApiBook, mode: 'detail') => void;
  onViewAll: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Cảnh báo tồn kho</h3>
          <p className="text-sm text-gray-500">Sách hết hàng và sắp hết để staff theo dõi và báo quản lý.</p>
        </div>
        <button type="button" onClick={onViewAll} className="text-sm font-semibold text-orange-600 hover:text-orange-700">
          Tất cả sách
        </button>
      </div>
      <div className="divide-y divide-gray-100">
        {stockAlertBooks.slice(0, 5).map((book) => {
          const stock = Number(book.stock || 0);
          return (
            <div key={book.id} className="flex items-center justify-between gap-4 px-6 py-4">
              <div className="min-w-0">
                <p className="line-clamp-1 font-semibold text-gray-950">{book.title}</p>
                <p className="mt-1 text-sm text-gray-500">{book.category?.name || 'Chưa phân loại'}</p>
                <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${stock <= 0 ? 'bg-rose-50 text-rose-700 ring-rose-100' : 'bg-amber-50 text-amber-700 ring-amber-100'}`}>
                  Tồn {stock.toLocaleString('vi-VN')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => openBookDetail(book, 'detail')}
                className="shrink-0 rounded-lg bg-orange-50 px-3 py-2 text-sm font-semibold text-orange-700 ring-1 ring-orange-100 transition-colors hover:bg-orange-100"
              >
                Xem chi tiết
              </button>
            </div>
          );
        })}
        {stockAlertBooks.length === 0 && <EmptyState text="Không có cảnh báo tồn kho." />}
      </div>
    </div>
  );
}

function ActivePromotionsCard({
  promotions,
  onViewPromotions,
  getPromotionRemainingText,
}: {
  promotions: AdminPromotion[];
  onViewPromotions: () => void;
  getPromotionRemainingText: (promotion: AdminPromotion) => string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Khuyến mãi đang chạy</h3>
          <p className="text-sm text-gray-500">Thông tin nhanh để tư vấn khách.</p>
        </div>
        <button type="button" onClick={onViewPromotions} className="text-sm font-semibold text-orange-600 hover:text-orange-700">
          Xem thêm
        </button>
      </div>
      <div className="divide-y divide-gray-100">
        {promotions.map((promotion) => (
          <div key={promotion.id} className="px-6 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="line-clamp-1 font-semibold text-gray-950">{promotion.name}</p>
                <p className="mt-1 text-sm text-gray-500">{promotion.bookCount || promotion.books?.length || 0} sách áp dụng</p>
              </div>
              <span className="shrink-0 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700 ring-1 ring-orange-100">
                -{promotion.discountPercent}%
              </span>
            </div>
            <p className="mt-2 text-sm font-medium text-gray-700">{getPromotionRemainingText(promotion)}</p>
          </div>
        ))}
        {promotions.length === 0 && <EmptyState text="Không có chương trình đang chạy." />}
      </div>
    </div>
  );
}

function RecentOrdersCard({
  dashboard,
  goToOrders,
  openOrderDetail,
}: {
  dashboard: AdminDashboardResponse | null;
  goToOrders: () => void;
  openOrderDetail: (order: AdminOrder) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        <h3 className="text-lg font-bold text-gray-900">Đơn gần đây</h3>
        <button type="button" onClick={goToOrders} className="text-sm font-semibold text-orange-600 hover:text-orange-700">
          Xem tất cả
        </button>
      </div>
      <div className="divide-y divide-gray-100">
        {(dashboard?.recentOrders || []).map((order) => (
          <button
            key={order.id}
            onClick={() => openOrderDetail(order)}
            className="w-full px-6 py-4 text-left transition-colors hover:bg-orange-50/60"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-gray-950">{order.orderCode || order.id.slice(0, 8)}</p>
                <p className="mt-1 text-sm text-gray-500">{order.customerName}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">{formatCurrency(order.totalAmount)}</p>
                <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${getOrderStatusPillClass(order.status)}`}>
                  {getOrderStatusText(order.status)}
                </span>
              </div>
            </div>
          </button>
        ))}
        {(dashboard?.recentOrders || []).length === 0 && <EmptyState text="Chưa có đơn gần đây." />}
      </div>
    </div>
  );
}

function LowStockCard({
  stockAlertBooks,
  openBookDetail,
  onViewLowStock,
}: {
  stockAlertBooks: ApiBook[];
  openBookDetail: (book: ApiBook, mode: 'detail') => void;
  onViewLowStock: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        <h3 className="text-lg font-bold text-gray-900">Sách tồn thấp</h3>
        <button type="button" onClick={onViewLowStock} className="text-sm font-semibold text-orange-600 hover:text-orange-700">
          Xem sách
        </button>
      </div>
      <div className="divide-y divide-gray-100">
        {stockAlertBooks.slice(0, 5).map((book) => {
          const stock = Number(book.stock || 0);
          return (
            <button
              key={book.id}
              type="button"
              onClick={() => openBookDetail(book, 'detail')}
              className="w-full px-6 py-4 text-left transition-colors hover:bg-orange-50/60"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="line-clamp-1 font-semibold text-gray-950">{book.title}</p>
                  <p className="mt-1 text-sm text-gray-500">Đã bán {Number(book.soldCount || 0).toLocaleString('vi-VN')}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${stock <= 0 ? 'bg-rose-50 text-rose-700 ring-rose-100' : 'bg-amber-50 text-amber-700 ring-amber-100'}`}>
                  Tồn {stock.toLocaleString('vi-VN')}
                </span>
              </div>
            </button>
          );
        })}
        {stockAlertBooks.length === 0 && <EmptyState text="Không có sách tồn thấp." />}
      </div>
    </div>
  );
}

function ActivePromotionsList({
  promotions,
  onViewPromotions,
  getPromotionRemainingText,
}: {
  promotions: AdminPromotion[];
  onViewPromotions: () => void;
  getPromotionRemainingText: (promotion: AdminPromotion) => string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
        <h3 className="text-lg font-bold text-gray-900">Khuyến mãi đang chạy</h3>
        <button type="button" onClick={onViewPromotions} className="text-sm font-semibold text-orange-600 hover:text-orange-700">
          Xem KM
        </button>
      </div>
      <div className="divide-y divide-gray-100">
        {promotions.map((promotion) => (
          <button
            key={promotion.id}
            type="button"
            onClick={onViewPromotions}
            className="w-full px-6 py-4 text-left transition-colors hover:bg-orange-50/60"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="line-clamp-1 font-semibold text-gray-950">{promotion.name}</p>
                <p className="mt-1 text-sm text-gray-500">{promotion.bookCount || promotion.books?.length || 0} sách · {getPromotionRemainingText(promotion)}</p>
              </div>
              <span className="shrink-0 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700 ring-1 ring-orange-100">
                -{promotion.discountPercent}%
              </span>
            </div>
          </button>
        ))}
        {promotions.length === 0 && <EmptyState text="Không có khuyến mãi đang chạy." />}
      </div>
    </div>
  );
}
