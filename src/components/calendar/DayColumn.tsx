import { useEffect, useRef, useState } from "react";

import EventCard from "./EventCard";

import type { CalendarEvent, TimeSelection } from "../../types/calendar";

import {
  HOUR_HEIGHT,
  TOTAL_HOURS,
  dateToPosition,
  getEventHeight,
  isSameDay,
  positionToMinutes,
  minutesToPixels,
} from "../../utils/calendar";

interface Props {
  day: Date;
  events: CalendarEvent[];

  onEventClick: (event: CalendarEvent) => void;

  onEventContextMenu: (event: CalendarEvent, x: number, y: number) => void;

  onTimeSelection: (selection: TimeSelection) => void;

  onMoveEvent: (
    eventId: string,
    startDateTime: Date,
    endDateTime: Date,
  ) => void;
}

interface SelectionState {
  startMinutes: number;
  currentMinutes: number;
}

export default function DayColumn({
  day,
  events,
  onEventClick,
  onEventContextMenu,
  onTimeSelection,
  onMoveEvent,
}: Props) {
  const columnRef = useRef<HTMLDivElement>(null);

  const [selection, setSelection] = useState<SelectionState | null>(null);

  const isSelecting = selection !== null;

  const dayEvents = events.filter((event) =>
    isSameDay(event.startDateTime, day),
  );

  /**
   * Start selecting empty area.
   */
  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    /**
     * Chỉ chuột trái.
     */
    if (e.button !== 0) return;

    /**
     * Nếu click Event thì EventCard
     * đã stop propagation.
     */
    const rect = columnRef.current?.getBoundingClientRect();

    if (!rect) return;

    const y = e.clientY - rect.top;

    const startMinutes = positionToMinutes(y);

    setSelection({
      startMinutes,
      currentMinutes: startMinutes,
    });
  }

  /**
   * Mouse move khi đang select.
   *
   * Dùng window để nếu chuột đi ra ngoài
   * DayColumn vẫn bắt được.
   */
  useEffect(() => {
    if (!isSelecting) return;

    function handlePointerMove(e: PointerEvent) {
      const rect = columnRef.current?.getBoundingClientRect();

      if (!rect) return;

      const y = e.clientY - rect.top;

      const currentMinutes = positionToMinutes(y);

      setSelection((prev) => {
        if (!prev) return null;

        return {
          ...prev,
          currentMinutes,
        };
      });
    }

    function handlePointerUp() {
      setSelection((prev) => {
        if (!prev) return null;

        const startMinutes = Math.min(prev.startMinutes, prev.currentMinutes);

        const endMinutes = Math.max(prev.startMinutes, prev.currentMinutes);

        /**
         * Nếu click đúng một điểm,
         * tạo minimum 15 phút.
         */
        const finalEnd =
          endMinutes === startMinutes ? startMinutes + 15 : endMinutes;

        onTimeSelection({
          day,
          startMinutes,
          endMinutes: Math.min(finalEnd, TOTAL_HOURS * 60),
        });

        return null;
      });
    }

    window.addEventListener("pointermove", handlePointerMove);

    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);

      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isSelecting, day, onTimeSelection]);

  let selectionTop = 0;
  let selectionHeight = 0;

  if (selection) {
    const start = Math.min(selection.startMinutes, selection.currentMinutes);

    const end = Math.max(selection.startMinutes, selection.currentMinutes);

    selectionTop = minutesToPixels(start);

    selectionHeight = minutesToPixels(Math.max(end - start, 15));
  }

  return (
    <div
      ref={columnRef}
      className="day-column"
      data-day={day.toISOString()}
      style={{
        height: TOTAL_HOURS * HOUR_HEIGHT,
      }}
      onPointerDown={handlePointerDown}
    >
      {/* Grid lines */}
      {Array.from({ length: TOTAL_HOURS }, (_, hour) => (
        <div
          key={hour}
          className="hour-row"
          style={{
            height: HOUR_HEIGHT,
          }}
        >
          <div className="half-hour-line" />
        </div>
      ))}

      {/* Current time */}
      {isSameDay(day, new Date()) && <CurrentTimeLine />}

      {/* Selection preview */}
      {selection && (
        <div
          className="selection-preview"
          style={{
            top: selectionTop,
            height: selectionHeight,
          }}
        />
      )}

      {/* Events */}
      {dayEvents.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          onClick={() => onEventClick(event)}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();

            onEventContextMenu(event, e.clientX, e.clientY);
          }}
          onMoveEvent={onMoveEvent}
          dayColumnRef={columnRef}
        />
      ))}
    </div>
  );
}

/**
 * Current time red line.
 */
function CurrentTimeLine() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 60_000);

    return () => window.clearInterval(timer);
  }, []);

  const top = dateToPosition(now);

  return (
    <div className="current-time-line" style={{ top }}>
      <div className="current-time-dot" />
    </div>
  );
}
