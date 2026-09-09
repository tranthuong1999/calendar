import { isSameDay, formatDate } from "../../utils/calendar";

interface Props {
  days: Date[];

  onDayClick: (day: Date) => void;
}

export default function CalendarHeader({ days, onDayClick }: Props) {
  const today = new Date();

  return (
    <header className="calendar-header">
      <div className="calendar-toolbar">
        <div className="toolbar-left">
          <button className="nav-button">‹</button>

          <button className="nav-button">›</button>

          <button className="today-button">Today</button>

          <h1>
            {today.toLocaleDateString([], {
              month: "long",
              year: "numeric",
            })}
          </h1>
        </div>
      </div>

      <div className="days-header">
        <div className="time-header-cell" />

        {days.map((day) => {
          const isToday = isSameDay(day, today);

          return (
            <div
              key={day.toISOString()}
              className="day-header day-header-clickable"
              role="button"
              tabIndex={0}
              onClick={() => onDayClick(day)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onDayClick(day);
                }
              }}
            >
              <span className="day-name">
                {formatDate(day).split(" ")[0].toUpperCase()}
              </span>

              <span
                className={`day-number ${isToday ? "day-number-today" : ""}`}
              >
                {day.getDate()}
              </span>
            </div>
          );
        })}
      </div>
    </header>
  );
}
