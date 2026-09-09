import type { CalendarEvent } from "../../types/calendar";

import { isSameDay, formatTime } from "../../utils/calendar";

interface Props {
  day: Date;

  events: CalendarEvent[];

  onClose: () => void;

  onSelectEvent: (event: CalendarEvent) => void;

  onCreateEvent: (day: Date) => void;
}

export default function DayView({
  day,
  events,
  onClose,
  onSelectEvent,
  onCreateEvent,
}: Props) {
  /**
   * Sự kiện trong ngày, sắp xếp theo giờ bắt đầu.
   */
  const dayEvents = events
    .filter((event) => isSameDay(event.startDateTime, day))
    .sort((a, b) => a.startDateTime.getTime() - b.startDateTime.getTime());

  const dateLabel = day.toLocaleDateString([], {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div
        className="event-dialog day-view"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="dialog-header">
          <h2>{dateLabel}</h2>

          <button className="dialog-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="day-view-body">
          {dayEvents.length === 0 ? (
            <p className="day-view-empty">
              Chưa có sự kiện nào trong ngày này.
            </p>
          ) : (
            <ul className="day-view-list">
              {dayEvents.map((event) => (
                <li
                  key={event.id}
                  className="day-view-item"
                  onClick={() => onSelectEvent(event)}
                >
                  <span className="day-view-time">
                    {formatTime(event.startDateTime)}
                    {" – "}
                    {formatTime(event.endDateTime)}
                  </span>

                  <span className="day-view-title">
                    {event.title || "(Không tiêu đề)"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="dialog-footer day-view-footer">
          <button className="secondary-button" onClick={onClose}>
            Đóng
          </button>

          <button className="primary-button" onClick={() => onCreateEvent(day)}>
            + Tạo sự kiện
          </button>
        </div>
      </div>
    </div>
  );
}
