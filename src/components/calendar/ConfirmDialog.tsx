interface Props {
  title: string;

  message: string;

  confirmLabel?: string;

  cancelLabel?: string;

  onConfirm: () => void;

  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: Props) {
  return (
    <div className="modal-overlay" onMouseDown={onCancel}>
      <div className="confirm-dialog" onMouseDown={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>{title}</h2>
        </div>

        <div className="confirm-body">{message}</div>

        <div className="dialog-footer confirm-footer">
          <button className="secondary-button" onClick={onCancel}>
            {cancelLabel}
          </button>

          <button className="danger-button" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
