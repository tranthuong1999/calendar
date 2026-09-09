interface Props {
  x: number;
  y: number;

  onEdit: () => void;
  onDelete: () => void;
}

export default function ContextMenu({ x, y, onEdit, onDelete }: Props) {
  return (
    <div
      className="context-menu"
      style={{
        left: x,
        top: y,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button className="context-menu-item" onClick={onEdit}>
        <span>✎</span>
        Edit
      </button>

      <button className="context-menu-item delete" onClick={onDelete}>
        <span>⌫</span>
        Delete
      </button>
    </div>
  );
}
