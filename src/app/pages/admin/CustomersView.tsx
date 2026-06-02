import { Plus } from 'lucide-react';
import type { AdminUser } from '../../services/admin.service';
import { EmptyState, SearchBox, TableCell, TableHead } from './components';
import type { UserLockFilter, UserVerifiedFilter } from './types';
import { formatCurrency, formatDate } from './utils';

type AccountViewMode = 'customers' | 'staff';
type MetricTone = 'gray' | 'emerald' | 'red' | 'amber' | 'blue' | 'orange';

type Metric = {
  label: string;
  value: number | string;
  tone: MetricTone;
};

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
  openCustomerDetail?: (customer: AdminUser) => void;
  loadingCustomerSummaryId?: string | null;
  handleToggleUserLock: (customer: AdminUser) => Promise<void>;
  handleChangeUserRole: (customer: AdminUser, role: string) => Promise<void>;
  handleResetUserPassword: (customer: AdminUser) => Promise<void>;
  updatingUserId: string | null;
  currentUserId?: string;
};

const vi = {
  customerTitle: 'Qu\u1ea3n l\u00fd kh\u00e1ch h\u00e0ng',
  staffTitle: 'Qu\u1ea3n l\u00fd nh\u00e2n vi\u00ean',
  createCustomer: 'T\u1ea1o kh\u00e1ch h\u00e0ng',
  createStaff: 'T\u1ea1o nh\u00e2n vi\u00ean',
  customerList: 'Danh s\u00e1ch kh\u00e1ch h\u00e0ng',
  staffList: 'Danh s\u00e1ch nh\u00e2n vi\u00ean',
  noCustomers: 'Kh\u00f4ng c\u00f3 kh\u00e1ch h\u00e0ng ph\u00f9 h\u1ee3p.',
  noStaff: 'Kh\u00f4ng c\u00f3 nh\u00e2n vi\u00ean ph\u00f9 h\u1ee3p.',
  staffHelp: 'Theo d\u00f5i t\u00e0i kho\u1ea3n nh\u00e2n vi\u00ean, tr\u1ea1ng th\u00e1i truy c\u1eadp v\u00e0 quy\u1ec1n s\u1eed d\u1ee5ng h\u1ec7 th\u1ed1ng.',
  customerHelp: 'Theo d\u00f5i t\u00e0i kho\u1ea3n kh\u00e1ch h\u00e0ng, tr\u1ea1ng th\u00e1i x\u00e1c th\u1ef1c v\u00e0 t\u00ecnh tr\u1ea1ng kh\u00f3a t\u00e0i kho\u1ea3n.',
  totalCustomers: 'T\u1ed5ng kh\u00e1ch h\u00e0ng',
  totalStaff: 'T\u1ed5ng nh\u00e2n vi\u00ean',
  active: '\u0110ang ho\u1ea1t \u0111\u1ed9ng',
  locked: '\u0110\u00e3 kh\u00f3a',
  unverified: 'Ch\u01b0a x\u00e1c th\u1ef1c',
  vipCustomers: 'Kh\u00e1ch VIP',
  customersWithOrders: '\u0110\u00e3 mua h\u00e0ng',
  totalSpent: 'T\u1ed5ng chi ti\u00eau',
  allStatus: 'T\u1ea5t c\u1ea3 tr\u1ea1ng th\u00e1i',
  allVerified: 'T\u1ea5t c\u1ea3 x\u00e1c th\u1ef1c',
  verified: '\u0110\u00e3 x\u00e1c th\u1ef1c',
  search: 'T\u00ecm theo t\u00ean, username ho\u1eb7c email...',
  matched: 't\u00e0i kho\u1ea3n ph\u00f9 h\u1ee3p v\u1edbi b\u1ed9 l\u1ecdc hi\u1ec7n t\u1ea1i',
  account: 'T\u00e0i kho\u1ea3n',
  contact: 'Li\u00ean h\u1ec7',
  role: 'Vai tr\u00f2',
  tier: 'H\u1ea1ng kh\u00e1ch',
  orderCount: 'S\u1ed1 \u0111\u01a1n',
  purchaseSummary: 'T\u00f3m t\u1eaft mua h\u00e0ng',
  lastOrder: '\u0110\u01a1n g\u1ea7n nh\u1ea5t',
  joined: 'Ng\u00e0y tham gia',
  status: 'Tr\u1ea1ng th\u00e1i',
  actions: 'Thao t\u00e1c',
  customerRole: 'Kh\u00e1ch h\u00e0ng',
  staffRole: 'Nh\u00e2n vi\u00ean',
  loading: '\u0110ang t\u1ea3i...',
  detail: 'Chi ti\u1ebft',
  unlock: 'M\u1edf kh\u00f3a',
  lock: 'Kh\u00f3a',
  noOrders: 'Ch\u01b0a c\u00f3 \u0111\u01a1n',
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
  openCustomerDetail,
  loadingCustomerSummaryId,
  handleToggleUserLock,
  handleChangeUserRole,
  handleResetUserPassword,
  updatingUserId,
  currentUserId,
}: CustomersViewProps) {
  const isStaffView = mode === 'staff';
  const title = isStaffView ? vi.staffTitle : vi.customerTitle;
  const createLabel = isStaffView ? vi.createStaff : vi.createCustomer;
  const createRole = isStaffView ? 'STAFF' : 'CUSTOMER';
  const listTitle = isStaffView ? vi.staffList : vi.customerList;
  const emptyText = isStaffView ? vi.noStaff : vi.noCustomers;
  const vipCustomerCount = accounts.filter((account) => Number(account.totalSpent || 0) >= 5000000).length;
  const customersWithOrders = accounts.filter((account) => Number(account.totalOrders || 0) > 0).length;
  const customerTotalSpent = accounts.reduce((sum, account) => sum + Number(account.totalSpent || 0), 0);
  const metricCards: Metric[] = isStaffView
    ? [
        { label: vi.totalStaff, value: accounts.length, tone: 'gray' },
        { label: vi.active, value: activeUsers.length, tone: 'emerald' as const },
        { label: vi.locked, value: lockedUsers.length, tone: 'red' as const },
        { label: vi.unverified, value: unverifiedUsers.length, tone: 'amber' as const },
      ]
    : [
        { label: vi.totalCustomers, value: accounts.length, tone: 'gray' },
        { label: vi.vipCustomers, value: vipCustomerCount, tone: 'emerald' as const },
        { label: vi.customersWithOrders, value: customersWithOrders, tone: 'blue' as const },
        { label: vi.totalSpent, value: formatCurrency(customerTotalSpent), tone: 'orange' as const },
      ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {metricCards.map((metric) => (
          <MetricCard key={metric.label} label={metric.label} value={metric.value} tone={metric.tone} />
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <p className="mt-1 text-sm text-gray-500">{isStaffView ? vi.staffHelp : vi.customerHelp}</p>
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
          <SearchBox value={searchQuery} onChange={setSearchQuery} placeholder={vi.search} />
          <select
            value={userLockFilter}
            onChange={(event) => setUserLockFilter(event.target.value as UserLockFilter)}
            className="rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">{vi.allStatus}</option>
            <option value="active">{vi.active}</option>
            <option value="locked">{vi.locked}</option>
          </select>
          <select
            value={userVerifiedFilter}
            onChange={(event) => setUserVerifiedFilter(event.target.value as UserVerifiedFilter)}
            className="rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">{vi.allVerified}</option>
            <option value="verified">{vi.verified}</option>
            <option value="unverified">{vi.unverified}</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <h3 className="text-lg font-semibold text-gray-900">{listTitle}</h3>
          <p className="text-sm text-gray-500">
            {filteredAccounts.length.toLocaleString('vi-VN')} {vi.matched}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className={`w-full ${isStaffView ? 'min-w-[980px]' : 'min-w-[920px]'}`}>
            <thead className="bg-gray-50">
              {isStaffView ? (
                <tr>
                  <TableHead>{vi.account}</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>{vi.role}</TableHead>
                  <TableHead>{vi.verified}</TableHead>
                  <TableHead>{vi.joined}</TableHead>
                  <TableHead>{vi.status}</TableHead>
                  <TableHead align="right">{vi.actions}</TableHead>
                </tr>
              ) : (
                <tr>
                  <TableHead>{vi.account}</TableHead>
                  <TableHead>{vi.contact}</TableHead>
                  <TableHead>{vi.purchaseSummary}</TableHead>
                  <TableHead>{vi.status}</TableHead>
                  <TableHead align="right">{vi.actions}</TableHead>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAccounts.map((account) => (
                <tr key={account.id} className="align-top hover:bg-orange-50/30">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(account.fullName || account.userName)}&background=F97316&color=fff`}
                        alt={account.fullName || account.userName}
                        className="h-11 w-11 rounded-full"
                      />
                      <div>
                        <p className="font-semibold text-gray-900">{account.fullName || account.userName}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <p className="text-xs text-gray-500">@{account.userName}</p>
                          {!isStaffView && <CustomerTierBadge totalSpent={Number(account.totalSpent || 0)} />}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  {isStaffView ? (
                    <>
                      <TableCell>{account.email}</TableCell>
                      <TableCell>
                        <select
                          value={account.role}
                          disabled={updatingUserId === account.id || account.id === currentUserId}
                          onChange={(event) => handleChangeUserRole(account, event.target.value)}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
                        >
                          <option value="STAFF">{vi.staffRole}</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </TableCell>
                      <TableCell>
                        <span className={`rounded-full px-2 py-1 text-xs ${account.isVerified ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                          {account.isVerified ? vi.verified : vi.unverified}
                        </span>
                      </TableCell>
                      <TableCell>{formatDate(account.createdAt)}</TableCell>
                      <TableCell>
                        <span className={`rounded-full px-2 py-1 text-xs ${account.isLocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          {account.isLocked ? vi.locked : 'Ho\u1ea1t \u0111\u1ed9ng'}
                        </span>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell>
                        <p className="font-medium text-gray-800">{account.email}</p>
                        <p className="mt-1 text-xs text-gray-500">{account.isVerified ? vi.verified : vi.unverified}</p>
                      </TableCell>
                      <TableCell>
                        <CustomerPurchaseSummary customer={account} noOrdersText={vi.noOrders} />
                      </TableCell>
                      <TableCell>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${account.isLocked ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          {account.isLocked ? vi.locked : 'Ho\u1ea1t \u0111\u1ed9ng'}
                        </span>
                      </TableCell>
                    </>
                  )}
                  <TableCell align="right">
                    <div className="flex flex-wrap justify-end gap-2">
                      {!isStaffView && openCustomerDetail && (
                        <button
                          type="button"
                          disabled={loadingCustomerSummaryId === account.id}
                          onClick={() => openCustomerDetail(account)}
                          className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100 disabled:opacity-50"
                        >
                          {loadingCustomerSummaryId === account.id ? vi.loading : vi.detail}
                        </button>
                      )}
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
                        {account.isLocked ? vi.unlock : vi.lock}
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
  value: number | string;
  tone?: MetricTone;
}) {
  const tones = {
    gray: 'text-gray-900',
    emerald: 'text-emerald-600',
    red: 'text-red-600',
    amber: 'text-amber-600',
    blue: 'text-blue-600',
    orange: 'text-orange-600',
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${tones[tone]}`}>
        {typeof value === 'number' ? value.toLocaleString('vi-VN') : value}
      </p>
    </div>
  );
}

function CustomerTierBadge({ totalSpent }: { totalSpent: number }) {
  if (totalSpent >= 5000000) {
    return <span className="rounded-full bg-purple-100 px-2 py-1 text-xs font-semibold text-purple-700">VIP</span>;
  }

  if (totalSpent >= 1000000) {
    return (
      <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
        Th\u00e2n thi\u1ebft
      </span>
    );
  }

  return <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600">M\u1edbi</span>;
}

function CustomerPurchaseSummary({
  customer,
  noOrdersText,
}: {
  customer: AdminUser;
  noOrdersText: string;
}) {
  const totalOrders = Number(customer.totalOrders || 0);
  const totalSpent = Number(customer.totalSpent || 0);

  if (totalOrders <= 0) {
    return <span className="text-sm text-gray-500">{noOrdersText}</span>;
  }

  return (
    <div className="space-y-1">
      <p className="font-semibold text-gray-900">{formatCurrency(totalSpent)}</p>
      <p className="text-xs text-gray-500">
        {totalOrders.toLocaleString('vi-VN')} \u0111\u01a1n
        {customer.lastOrderAt ? ` \u00b7 ${formatDate(customer.lastOrderAt)}` : ''}
      </p>
    </div>
  );
}
