import { useEffect, useRef, useState } from "react";

import type { CalendarEvent } from "../../types/calendar";

import {
  TOTAL_HOURS,
  dateToPosition,
  getEventHeight,
  getDurationInMinutes,
  minutesToDate,
  minutesToPixels,
  positionToMinutes,
  formatTime,
} from "../../utils/calendar";

/**
 * Tìm cột .day-column (và ngày tương ứng) nằm dưới toạ độ con trỏ.
 * Trả về null nếu con trỏ không nằm trên cột ngày nào.
 */
function getColumnUnderPointer(
  clientX: number,
  clientY: number,
): { day: Date; column: HTMLElement } | null {
  const elements = document.elementsFromPoint(clientX, clientY);

  for (const el of elements) {
    const column = (el as HTMLElement).closest?.(
      ".day-column",
    ) as HTMLElement | null;

    const iso = column?.dataset.day;

    if (column && iso) {
      const date = new Date(iso);

      if (!Number.isNaN(date.getTime())) {
        return {
          day: date,
          column,
        };
      }
    }
  }

  return null;
}

interface Props {
  event: CalendarEvent;

  onClick: () => void;

  onContextMenu: (e: React.MouseEvent) => void;

  onMoveEvent: (
    eventId: string,
    startDateTime: Date,
    endDateTime: Date,
  ) => void;

  dayColumnRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Ngưỡng pixel để phân biệt click với drag.
 */
const DRAG_THRESHOLD = 4;

interface DragState {
  /**
   * Offset (phút) từ đỉnh event tới điểm nhấn,
   * dùng để giữ nguyên vị trí tương đối khi kéo.
   */
  pointerOffsetMinutes: number;

  /**
   * Duration của event, giữ nguyên trong suốt drag.
   */
  durationMinutes: number;

  /**
   * Đã vượt ngưỡng dịch chuyển để coi là drag chưa.
   */
  moved: boolean;

  /**
   * Vị trí bắt đầu để đo ngưỡng (cả X và Y).
   */
  startClientX: number;
  startClientY: number;

  /**
   * Số phút bắt đầu mới (sau snap/clamp) tính từ lần move gần nhất.
   */
  startMinutes: number;

  /**
   * Ngày đích dưới con trỏ (đổi khi kéo sang cột khác).
   */
  targetDay: Date;
}

export default function EventCard({
  event,
  onClick,
  onContextMenu,
  onMoveEvent,
  dayColumnRef,
}: Props) {
  const dragRef = useRef<DragState | null>(null);

  const [previewTop, setPreviewTop] = useState<number | null>(null);

  const top = previewTop ?? dateToPosition(event.startDateTime);

  const height = getEventHeight(event);

  /**
   * Event ngắn (<= ~40 phút) không đủ chỗ cho 2 dòng,
   * hiển thị gọn tiêu đề + giờ trên cùng 1 dòng.
   */
  const isCompact = height < 44;

  /**
   * Bắt đầu kéo event.
   */
  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    /**
     * Chỉ chuột trái mới kéo.
     */
    if (e.button !== 0) return;

    e.stopPropagation();

    const rect = dayColumnRef.current?.getBoundingClientRect();

    if (!rect) return;

    const pointerMinutes = positionToMinutes(e.clientY - rect.top);

    const startMinutes = positionToMinutes(dateToPosition(event.startDateTime));

    dragRef.current = {
      pointerOffsetMinutes: pointerMinutes - startMinutes,
      durationMinutes: getDurationInMinutes(
        event.startDateTime,
        event.endDateTime,
      ),
      moved: false,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startMinutes,
      targetDay: event.startDateTime,
    };
  }

  useEffect(() => {
    function handlePointerMove(e: PointerEvent) {
      const drag = dragRef.current;

      if (!drag) return;

      if (
        !drag.moved &&
        Math.hypot(
          e.clientX - drag.startClientX,
          e.clientY - drag.startClientY,
        ) < DRAG_THRESHOLD
      ) {
        return;
      }

      drag.moved = true;

      /**
       * Xác định cột ngày dưới con trỏ để hỗ trợ
       * kéo ngang sang ngày khác (R6.5). Nếu con trỏ
       * ra ngoài các cột, giữ nguyên ngày đích gần nhất.
       */
      const under = getColumnUnderPointer(e.clientX, e.clientY);

      if (under) {
        drag.targetDay = under.day;
      }

      /**
       * Dùng rect của cột đích (nếu có) để tính giờ,
       * ngược lại fallback về cột gốc.
       */
      const rect = (
        under?.column ?? dayColumnRef.current
      )?.getBoundingClientRect();

      if (!rect) return;

      const pointerMinutes = positionToMinutes(e.clientY - rect.top);

      const rawStart = pointerMinutes - drag.pointerOffsetMinutes;

      /**
       * Clamp để giữ event trong ngày mà
       * vẫn giữ nguyên duration.
       */
      const maxStart = TOTAL_HOURS * 60 - drag.durationMinutes;

      const clampedStart = Math.max(0, Math.min(rawStart, maxStart));

      drag.startMinutes = clampedStart;

      setPreviewTop(minutesToPixels(clampedStart));
    }

    function handlePointerUp() {
      const drag = dragRef.current;

      dragRef.current = null;

      if (!drag) return;

      if (!drag.moved) {
        /**
         * Không dịch chuyển đủ → coi là click.
         */
        setPreviewTop(null);
        onClick();
        return;
      }

      /**
       * Dựng thời gian mới trên ngày đích (có thể là
       * cột ngày khác nếu người dùng kéo ngang), giữ
       * nguyên duration.
       */
      const start = minutesToDate(drag.targetDay, drag.startMinutes);

      const end = minutesToDate(
        drag.targetDay,
        drag.startMinutes + drag.durationMinutes,
      );

      onMoveEvent(event.id, start, end);

      setPreviewTop(null);
    }

    window.addEventListener("pointermove", handlePointerMove);

    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);

      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [event.id, event.startDateTime, dayColumnRef, onClick, onMoveEvent]);

  return (
    <div
      className={`event-card${
        previewTop !== null ? " event-card-dragging" : ""
      }${isCompact ? " event-card-compact" : ""}`}
      style={{
        top,
        height,
      }}
      onPointerDown={handlePointerDown}
      onContextMenu={onContextMenu}
    >
      <div className="event-title">{event.title || "(Không tiêu đề)"}</div>

      <div className="event-time">
        {formatTime(event.startDateTime)}
        {" – "}
        {formatTime(event.endDateTime)}
      </div>
    </div>
  );
}
