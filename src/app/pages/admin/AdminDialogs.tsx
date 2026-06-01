import type { FormEvent } from 'react';
import { AlertCircle, X } from 'lucide-react';
import type { CancelDecisionDialog, ConfirmDialog } from './types';
import { hasPendingCustomerCancelRequest } from './utils';

type ConfirmDialogModalProps = {
  confirmDialog: NonNullable<ConfirmDialog>;
  isConfirmingDialog: boolean;
  closeConfirmDialog: () => void;
  handleConfirmDialog: () => void | Promise<void>;
};

export function ConfirmDialogModal({
  confirmDialog,
  isConfirmingDialog,
  closeConfirmDialog,
  handleConfirmDialog,
}: ConfirmDialogModalProps) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className={`rounded-full p-3 ${confirmDialog.variant === 'danger' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900">{confirmDialog.title}</h3>
            <p className="mt-2 text-sm leading-6 text-gray-600">{confirmDialog.message}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            disabled={isConfirmingDialog}
            onClick={closeConfirmDialog}
            className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            disabled={isConfirmingDialog}
            onClick={handleConfirmDialog}
            className={`rounded-lg px-4 py-2 font-semibold text-white disabled:opacity-50 ${
              confirmDialog.variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-500 hover:bg-orange-600'
            }`}
          >
            {isConfirmingDialog ? 'Đang xử lý...' : confirmDialog.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

type CancelDecisionModalProps = {
  cancelDecisionDialog: NonNullable<CancelDecisionDialog>;
  cancelDecisionNote: string;
  updatingStatus: boolean;
  closeCancelDecisionDialog: () => void;
  setCancelDecisionNote: (value: string) => void;
  handleCancelDecisionSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
};

export function CancelDecisionModal({
  cancelDecisionDialog,
  cancelDecisionNote,
  updatingStatus,
  closeCancelDecisionDialog,
  setCancelDecisionNote,
  handleCancelDecisionSubmit,
}: CancelDecisionModalProps) {
  const isApproveAction = cancelDecisionDialog.action === 'approve';
  const hasPendingRequest = hasPendingCustomerCancelRequest(cancelDecisionDialog.order);

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/50 p-4">
      <form
        onSubmit={handleCancelDecisionSubmit}
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className={`px-6 py-5 text-white ${isApproveAction ? 'bg-red-600' : 'bg-orange-500'}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold">
                {isApproveAction
                  ? hasPendingRequest
                    ? 'Duyệt hủy đơn hàng'
                    : 'Hủy đơn thủ công'
                  : 'Từ chối yêu cầu hủy'}
              </h3>
              <p className="mt-1 text-sm text-white/90">
                Đơn {cancelDecisionDialog.order.orderCode || cancelDecisionDialog.order.id.slice(0, 8)}
              </p>
            </div>
            <button
              type="button"
              onClick={closeCancelDecisionDialog}
              disabled={updatingStatus}
              className="rounded-lg p-1.5 text-white/80 hover:bg-white/15 hover:text-white disabled:opacity-50"
              title="Đóng"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="space-y-4 p-6">
          <label className="block">
            <span className="text-sm font-semibold text-gray-800">
              {isApproveAction ? 'Lý do hủy đơn' : 'Lý do từ chối yêu cầu hủy'}
            </span>
            <textarea
              value={cancelDecisionNote}
              onChange={(event) => setCancelDecisionNote(event.target.value.slice(0, 500))}
              rows={4}
              className="mt-2 w-full resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              placeholder={isApproveAction ? 'Nhập lý do hủy đơn hàng...' : 'Nhập lý do từ chối yêu cầu hủy...'}
            />
          </label>
          <div className="text-right text-xs text-gray-500">{cancelDecisionNote.length}/500</div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeCancelDecisionDialog}
              disabled={updatingStatus}
              className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Đóng
            </button>
            <button
              type="submit"
              disabled={updatingStatus || cancelDecisionNote.trim().length === 0}
              className={`rounded-lg px-4 py-2 font-semibold text-white disabled:opacity-50 ${
                isApproveAction ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-500 hover:bg-orange-600'
              }`}
            >
              {updatingStatus
                ? 'Đang xử lý...'
                : isApproveAction
                  ? hasPendingRequest
                    ? 'Duyệt hủy'
                    : 'Hủy đơn'
                  : 'Từ chối yêu cầu'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
