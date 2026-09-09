import TimeColumn from "./TimeColumn";
import DayColumn from "./DayColumn";

import type { CalendarEvent, TimeSelection } from "../../types/calendar";

interface Props {
  days: Date[];

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

export default function CalendarBody({
  days,
  events,
  onEventClick,
  onEventContextMenu,
  onTimeSelection,
  onMoveEvent,
}: Props) {
  return (
    <main className="calendar-body">
      <div className="calendar-scroll">
        <div className="calendar-grid">
          <TimeColumn />

          {days.map((day) => (
            <DayColumn
              key={day.toISOString()}
              day={day}
              events={events}
              onEventClick={onEventClick}
              onEventContextMenu={onEventContextMenu}
              onTimeSelection={onTimeSelection}
              onMoveEvent={onMoveEvent}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
