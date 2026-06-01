import type { Dispatch, FormEvent, SetStateAction } from 'react';
import { X } from 'lucide-react';
import type { AdminUserPayload } from '../../services/admin.service';
import { UserInput } from './components';

type UserCreateModalProps = {
  userForm: AdminUserPayload;
  setUserForm: Dispatch<SetStateAction<AdminUserPayload>>;
  savingUser: boolean;
  closeUserModal: () => void;
  handleCreateUser: (event: FormEvent) => void | Promise<void>;
};

export function UserCreateModal({
  userForm,
  setUserForm,
  savingUser,
  closeUserModal,
  handleCreateUser,
}: UserCreateModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form onSubmit={handleCreateUser} className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Tạo tài khoản</h3>
            <p className="text-sm text-gray-500">Tạo tài khoản khách hàng hoặc nhân viên mới.</p>
          </div>
          <button
            type="button"
            disabled={savingUser}
            onClick={closeUserModal}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-4 p-6 md:grid-cols-2">
          <UserInput
            label="Tên đăng nhập"
            required
            value={userForm.userName}
            onChange={(value) => setUserForm((prev) => ({ ...prev, userName: value }))}
          />
          <UserInput
            label="Họ và tên"
            value={userForm.fullName || ''}
            onChange={(value) => setUserForm((prev) => ({ ...prev, fullName: value }))}
          />
          <UserInput
            label="Email"
            type="email"
            required
            value={userForm.email}
            onChange={(value) => setUserForm((prev) => ({ ...prev, email: value }))}
          />
          <UserInput
            label="Số điện thoại"
            value={userForm.phone || ''}
            onChange={(value) => setUserForm((prev) => ({ ...prev, phone: value }))}
          />
          <UserInput
            label="Mật khẩu"
            type="password"
            required
            value={userForm.password}
            onChange={(value) => setUserForm((prev) => ({ ...prev, password: value }))}
          />
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Vai trò <span className="text-red-500">*</span>
            </label>
            <select
              value={userForm.role}
              onChange={(event) => setUserForm((prev) => ({ ...prev, role: event.target.value as 'CUSTOMER' | 'STAFF' }))}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="CUSTOMER">Khách hàng</option>
              <option value="STAFF">Nhân viên</option>
            </select>
          </div>
          <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 md:col-span-2">
            <input
              type="checkbox"
              checked={Boolean(userForm.isVerified)}
              onChange={(event) => setUserForm((prev) => ({ ...prev, isVerified: event.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
            />
            <span className="text-sm font-medium text-gray-700">Đánh dấu email đã xác thực</span>
          </label>
          <div className="rounded-xl bg-orange-50 p-4 text-sm leading-6 text-orange-700 md:col-span-2">
            Mật khẩu cần ít nhất 8 ký tự, gồm chữ hoa, chữ thường và số.
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button
            type="button"
            disabled={savingUser}
            onClick={closeUserModal}
            className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Đóng
          </button>
          <button
            type="submit"
            disabled={savingUser}
            className="rounded-lg bg-orange-500 px-5 py-2 font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
          >
            {savingUser ? 'Đang tạo...' : 'Tạo tài khoản'}
          </button>
        </div>
      </form>
    </div>
  );
}
