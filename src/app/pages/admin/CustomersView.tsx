import { Plus } from 'lucide-react';
import type { AdminUser } from '../../services/admin.service';
import { EmptyState, SearchBox, TableCell, TableHead } from './components';
import type { UserLockFilter, UserVerifiedFilter } from './types';
import { formatDate } from './utils';

type AccountViewMode = 'customers' | 'staff';

type CustomersViewProps = {
  mode: AccountViewMode;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  accounts: AdminUser[];
  activeUsers: AdminUser[];
  lockedUsers: AdminUser[];
  unverifiedUsers: AdminUser[];
  filteredAccounts: AdminUser[];
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

const roleLabel: Record<string, string> = {
  CUSTOMER: 'Khách hàng',
  STAFF: 'Nhân viên',
  ADMIN: 'Admin',
  GUEST: 'Khách vãng lai',
};

export function CustomersView({
  mode,
  searchQuery,
  setSearchQuery,
  accounts,
  activeUsers,
  lockedUsers,
  unverifiedUsers,
  filteredAccounts,
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
  const isStaffView = mode === 'staff';
  const title = isStaffView ? 'Quản lý nhân viên' : 'Quản lý khách hàng';
  const createLabel = isStaffView ? 'Tạo nhân viên' : 'Tạo khách hàng';
  const createRole = isStaffView ? 'STAFF' : 'CUSTOMER';
  const listTitle = isStaffView ? 'Danh sách nhân viên' : 'Danh sách khách hàng';
  const emptyText = isStaffView ? 'Không có nhân viên phù hợp.' : 'Không có khách hàng phù hợp.';

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label={isStaffView ? 'Tổng nhân viên' : 'Tổng khách hàng'} value={accounts.length} />
        <MetricCard label="Đang hoạt động" value={activeUsers.length} tone="emerald" />
        <MetricCard label="Đã khóa" value={lockedUsers.length} tone="red" />
        <MetricCard label="Chưa xác thực" value={unverifiedUsers.length} tone="amber" />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <p className="mt-1 text-sm text-gray-500">
            {isStaffView
              ? 'Theo dõi tài khoản nhân viên, trạng thái truy cập và quyền sử dụng hệ thống.'
              : 'Theo dõi tài khoản khách hàng, trạng thái xác thực và tình trạng khóa tài khoản.'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => openCreateUserModal(createRole)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2 font-semibold text-white transition-colors hover:bg-orange-600"
        >
          <Plus className="h-4 w-4" />
          {createLabel}
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px]">
          <SearchBox value={searchQuery} onChange={setSearchQuery} placeholder="Tìm theo tên, username hoặc email..." />
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

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <h3 className="text-lg font-semibold text-gray-900">{listTitle}</h3>
          <p className="text-sm text-gray-500">
            {filteredAccounts.length.toLocaleString('vi-VN')} tài khoản phù hợp với bộ lọc hiện tại
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
              {filteredAccounts.map((account) => (
                <tr key={account.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(account.fullName || account.userName)}&background=F97316&color=fff`}
                        alt={account.fullName || account.userName}
                        className="h-10 w-10 rounded-full"
                      />
                      <div>
                        <p className="font-medium text-gray-800">{account.fullName || account.userName}</p>
                        <p className="text-xs text-gray-500">@{account.userName}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{account.email}</TableCell>
                  <TableCell>
                    {isStaffView ? (
                      <select
                        value={account.role}
                        disabled={updatingUserId === account.id || account.id === currentUserId}
                        onChange={(event) => handleChangeUserRole(account, event.target.value)}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
                      >
                        <option value="STAFF">Nhân viên</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    ) : (
                      <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                        {roleLabel[account.role] || account.role}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2 py-1 text-xs ${account.isVerified ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                      {account.isVerified ? 'Đã xác thực' : 'Chưa xác thực'}
                    </span>
                  </TableCell>
                  <TableCell>{formatDate(account.createdAt)}</TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2 py-1 text-xs ${account.isLocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {account.isLocked ? 'Đã khóa' : 'Hoạt động'}
                    </span>
                  </TableCell>
                  <TableCell align="right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        disabled={updatingUserId === account.id || account.id === currentUserId}
                        onClick={() => handleToggleUserLock(account)}
                        className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-50 ${
                          account.isLocked
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-red-50 text-red-700 hover:bg-red-100'
                        }`}
                      >
                        {account.isLocked ? 'Mở khóa' : 'Khóa'}
                      </button>
                      <button
                        type="button"
                        disabled={updatingUserId === account.id}
                        onClick={() => handleResetUserPassword(account)}
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
        {filteredAccounts.length === 0 && <EmptyState text={emptyText} />}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  tone = 'gray',
}: {
  label: string;
  value: number;
  tone?: 'gray' | 'emerald' | 'red' | 'amber';
}) {
  const tones = {
    gray: 'text-gray-900',
    emerald: 'text-emerald-600',
    red: 'text-red-600',
    amber: 'text-amber-600',
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${tones[tone]}`}>{value.toLocaleString('vi-VN')}</p>
    </div>
  );
}
