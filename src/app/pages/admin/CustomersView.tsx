import { Plus } from 'lucide-react';
import type { AdminUser } from '../../services/admin.service';
import { EmptyState, SearchBox, TableCell, TableHead } from './components';
import type { UserLockFilter, UserRoleFilter, UserVerifiedFilter } from './types';
import { formatDate } from './utils';

type CustomersViewProps = {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  customers: AdminUser[];
  activeUsers: AdminUser[];
  lockedUsers: AdminUser[];
  unverifiedUsers: AdminUser[];
  filteredCustomers: AdminUser[];
  userRoleFilter: UserRoleFilter;
  setUserRoleFilter: (value: UserRoleFilter) => void;
  userLockFilter: UserLockFilter;
  setUserLockFilter: (value: UserLockFilter) => void;
  userVerifiedFilter: UserVerifiedFilter;
  setUserVerifiedFilter: (value: UserVerifiedFilter) => void;
  openCreateUserModal: (role?: 'CUSTOMER' | 'STAFF') => void;
  handleToggleUserLock: (customer: AdminUser) => Promise<void>;
  handleChangeUserRole: (customer: AdminUser, role: string) => Promise<void>;
  handleResetUserPassword: (customer: AdminUser) => Promise<void>;
  updatingUserId: string | null;
  currentUserId?: string;
};

export function CustomersView({
  searchQuery,
  setSearchQuery,
  customers,
  activeUsers,
  lockedUsers,
  unverifiedUsers,
  filteredCustomers,
  userRoleFilter,
  setUserRoleFilter,
  userLockFilter,
  setUserLockFilter,
  userVerifiedFilter,
  setUserVerifiedFilter,
  openCreateUserModal,
  handleToggleUserLock,
  handleChangeUserRole,
  handleResetUserPassword,
  updatingUserId,
  currentUserId,
}: CustomersViewProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Tổng tài khoản</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{customers.length}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Đang hoạt động</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">{activeUsers.length}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Đã khóa</p>
          <p className="mt-2 text-3xl font-bold text-red-600">{lockedUsers.length}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Chưa xác thực</p>
          <p className="mt-2 text-3xl font-bold text-amber-600">{unverifiedUsers.length}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Tạo tài khoản mới</h3>
          <p className="mt-1 text-sm text-gray-500">Admin có thể tạo tài khoản khách hàng hoặc nhân viên để sử dụng hệ thống.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => openCreateUserModal('CUSTOMER')}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-orange-200 px-4 py-2 font-semibold text-orange-600 transition-colors hover:bg-orange-50"
          >
            <Plus className="h-4 w-4" />
            Tạo khách hàng
          </button>
          <button
            type="button"
            onClick={() => openCreateUserModal('STAFF')}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2 font-semibold text-white transition-colors hover:bg-orange-600"
          >
            <Plus className="h-4 w-4" />
            Tạo nhân viên
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_180px]">
          <SearchBox value={searchQuery} onChange={setSearchQuery} placeholder="Tìm theo tên, username hoặc email..." />
          <select
            value={userRoleFilter}
            onChange={(event) => setUserRoleFilter(event.target.value as UserRoleFilter)}
            className="rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">Tất cả vai trò</option>
            <option value="CUSTOMER">Khách hàng</option>
            <option value="STAFF">Nhân viên</option>
            <option value="ADMIN">Admin</option>
            <option value="GUEST">Khách vãng lai</option>
          </select>
          <select
            value={userLockFilter}
            onChange={(event) => setUserLockFilter(event.target.value as UserLockFilter)}
            className="rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="locked">Đã khóa</option>
          </select>
          <select
            value={userVerifiedFilter}
            onChange={(event) => setUserVerifiedFilter(event.target.value as UserVerifiedFilter)}
            className="rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">Tất cả xác thực</option>
            <option value="verified">Đã xác thực</option>
            <option value="unverified">Chưa xác thực</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-4">
          <h3 className="text-lg font-semibold text-gray-900">Danh sách tài khoản</h3>
          <p className="text-sm text-gray-500">
            {filteredCustomers.length.toLocaleString('vi-VN')} tài khoản phù hợp với bộ lọc hiện tại
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px]">
            <thead className="bg-gray-50">
              <tr>
                <TableHead>Tài khoản</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Vai trò</TableHead>
                <TableHead>Xác thực</TableHead>
                <TableHead>Ngày tham gia</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead align="right">Thao tác</TableHead>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(customer.fullName || customer.userName)}&background=F97316&color=fff`}
                        alt={customer.fullName || customer.userName}
                        className="w-10 h-10 rounded-full"
                      />
                      <div>
                        <p className="font-medium text-gray-800">{customer.fullName || customer.userName}</p>
                        <p className="text-xs text-gray-500">{customer.role}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>
                    <select
                      value={customer.role}
                      disabled={updatingUserId === customer.id || customer.id === currentUserId}
                      onChange={(event) => handleChangeUserRole(customer, event.target.value)}
                      className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
                    >
                      <option value="CUSTOMER">CUSTOMER</option>
                      <option value="STAFF">STAFF</option>
                      <option value="ADMIN">ADMIN</option>
                      <option value="GUEST">GUEST</option>
                    </select>
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-1 rounded-full ${customer.isVerified ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                      {customer.isVerified ? 'Đã xác thực' : 'Chưa xác thực'}
                    </span>
                  </TableCell>
                  <TableCell>{formatDate(customer.createdAt)}</TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-1 rounded-full ${customer.isLocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {customer.isLocked ? 'Đã khóa' : 'Hoạt động'}
                    </span>
                  </TableCell>
                  <TableCell align="right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        disabled={updatingUserId === customer.id || customer.id === currentUserId}
                        onClick={() => handleToggleUserLock(customer)}
                        className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
                          customer.isLocked
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-red-50 text-red-700 hover:bg-red-100'
                        }`}
                      >
                        {customer.isLocked ? 'Mở khóa' : 'Khóa'}
                      </button>
                      <button
                        type="button"
                        disabled={updatingUserId === customer.id}
                        onClick={() => handleResetUserPassword(customer)}
                        className="rounded-lg bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-50"
                      >
                        Reset MK
                      </button>
                    </div>
                  </TableCell>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredCustomers.length === 0 && <EmptyState text="Không có khách hàng phù hợp." />}
      </div>
    </div>
  );
}
