import { HOUR_HEIGHT, TOTAL_HOURS } from "../../utils/calendar";

export default function TimeColumn() {
  return (
    <div className="time-column">
      {Array.from({ length: TOTAL_HOURS }, (_, hour) => (
        <div
          key={hour}
          className="time-label"
          style={{
            height: HOUR_HEIGHT,
          }}
        >
          <span>
            {String(hour).padStart(2, "0")}
            :00
          </span>
        </div>
      ))}
    </div>
  );
}
