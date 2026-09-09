import { FormEvent, useEffect, useState } from "react";

import type { CalendarEvent, DialogMode } from "../../types/calendar";

import { toDateTimeInput } from "../../utils/calendar";

interface Props {
  mode: Exclude<DialogMode, null>;

  event: CalendarEvent;

  onClose: () => void;

  onCreate: (event: CalendarEvent) => void;

  onUpdate: (event: CalendarEvent) => void;
}

export default function EventDialog({
  mode,
  event,
  onClose,
  onCreate,
  onUpdate,
}: Props) {
  const [title, setTitle] = useState("");

  const [description, setDescription] = useState("");

  const [startDateTime, setStartDateTime] = useState("");

  const [endDateTime, setEndDateTime] = useState("");

  useEffect(() => {
    setTitle(event.title);
    setDescription(event.description);

    setStartDateTime(toDateTimeInput(event.startDateTime));

    setEndDateTime(toDateTimeInput(event.endDateTime));
  }, [event]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      alert("Title is required");
      return;
    }

    if (!startDateTime || !endDateTime) {
      alert("Start and end time are required");
      return;
    }

    const start = new Date(startDateTime);

    const end = new Date(endDateTime);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      alert("Invalid date");
      return;
    }

    if (end <= start) {
      alert("End time must be after start time");

      return;
    }

    const updatedEvent: CalendarEvent = {
      ...event,
      title: title.trim(),
      description: description.trim(),
      startDateTime: start,
      endDateTime: end,
    };

    if (mode === "create") {
      onCreate(updatedEvent);
      return;
    }

    if (mode === "edit") {
      onUpdate(updatedEvent);
    }
  }

  const isView = mode === "view";

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="event-dialog" onMouseDown={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>
            {mode === "create"
              ? "Create event"
              : mode === "edit"
                ? "Edit event"
                : "Event details"}
          </h2>

          <button className="dialog-close" onClick={onClose}>
            ×
          </button>
        </div>

        {isView ? (
          <div className="event-detail">
            <div className="detail-title">{event.title}</div>

            <div className="detail-row">
              <span className="detail-icon">📝</span>

              <span>{event.description || "No description"}</span>
            </div>

            <div className="detail-row">
              <span className="detail-icon">🕐</span>

              <div>
                <div>{event.startDateTime.toLocaleDateString()}</div>

                <div>
                  {event.startDateTime.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}

                  {" – "}

                  {event.endDateTime.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}
                </div>
              </div>
            </div>

            <div className="dialog-footer">
              <button className="secondary-button" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Title</label>

              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Add title"
              />
            </div>

            <div className="form-group">
              <label>Description</label>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add description"
                rows={4}
              />
            </div>

            <div className="form-group">
              <label>Start date & time</label>

              <input
                type="datetime-local"
                value={startDateTime}
                onChange={(e) => setStartDateTime(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>End date & time</label>

              <input
                type="datetime-local"
                value={endDateTime}
                onChange={(e) => setEndDateTime(e.target.value)}
              />
            </div>

            <div className="dialog-footer">
              <button
                type="button"
                className="secondary-button"
                onClick={onClose}
              >
                Cancel
              </button>

              <button type="submit" className="primary-button">
                {mode === "edit" ? "Save" : "Create"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
