import { useEffect, useMemo, useState } from "react";

import CalendarHeader from "./CalendarHeader";
import CalendarBody from "./CalendarBody";
import EventDialog from "./EventDialog";
import ContextMenu from "./ContextMenu";
import DayView from "./DayView";
import ConfirmDialog from "./ConfirmDialog";

import type {
  CalendarEvent,
  DialogMode,
  ContextMenuState,
  TimeSelection,
} from "../../types/calendar";

import { getCalendarDays, loadEvents, saveEvents } from "../../utils/calendar";

export default function Calendar() {
  /**
   * Giữ ngày bắt đầu cố định trong
   * vòng đời của Calendar.
   */
  const [baseDate] = useState(() => {
    const date = new Date();

    date.setHours(0, 0, 0, 0);

    return date;
  });

  /**
   * 7 ngày dùng chung cho cả Header
   * và Body.
   */
  const days = useMemo(() => getCalendarDays(baseDate, 7), [baseDate]);

  /**
   * Khôi phục event đã lưu trong localStorage.
   * Mặc định rỗng khi chưa có dữ liệu.
   */
  const [events, setEvents] = useState<CalendarEvent[]>(() => loadEvents());

  /**
   * Lưu event vào localStorage mỗi khi thay đổi
   * để không mất dữ liệu khi reload.
   */
  useEffect(() => {
    saveEvents(events);
  }, [events]);

  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null,
  );

  const [dialogMode, setDialogMode] = useState<DialogMode>(null);

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  /**
   * Ngày đang xem chi tiết (Day view). null = đóng.
   */
  const [dayViewDate, setDayViewDate] = useState<Date | null>(null);

  /**
   * Id event đang chờ xác nhận xóa. null = không có.
   */
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  /**
   * Click Event
   */
  function handleEventClick(event: CalendarEvent) {
    setSelectedEvent(event);
    setDialogMode("view");
    setContextMenu(null);
  }

  /**
   * Right click Event
   */
  function handleEventContextMenu(event: CalendarEvent, x: number, y: number) {
    setContextMenu({
      eventId: event.id,
      x,
      y,
    });
  }

  /**
   * Drag empty area
   */
  function handleTimeSelection(selection: TimeSelection) {
    const startDateTime = new Date(selection.day);

    startDateTime.setHours(0, 0, 0, 0);

    startDateTime.setMinutes(selection.startMinutes);

    const endDateTime = new Date(selection.day);

    endDateTime.setHours(0, 0, 0, 0);

    endDateTime.setMinutes(selection.endMinutes);

    const newEvent: CalendarEvent = {
      id: crypto.randomUUID(),
      title: "",
      description: "",
      startDateTime,
      endDateTime,
    };

    setSelectedEvent(newEvent);
    setDialogMode("create");
  }

  /**
   * Create
   */
  function handleCreate(event: CalendarEvent) {
    setEvents((prev) => [...prev, event]);

    closeDialog();
  }

  /**
   * Update
   */
  function handleUpdate(updatedEvent: CalendarEvent) {
    setEvents((prev) =>
      prev.map((event) =>
        event.id === updatedEvent.id ? updatedEvent : event,
      ),
    );

    closeDialog();
  }

  /**
   * Move Event
   */
  function handleMoveEvent(
    eventId: string,
    startDateTime: Date,
    endDateTime: Date,
  ) {
    setEvents((prev) =>
      prev.map((event) =>
        event.id === eventId
          ? {
              ...event,
              startDateTime,
              endDateTime,
            }
          : event,
      ),
    );
  }

  /**
   * Delete: mở hộp thoại xác nhận trước khi xóa.
   */
  function handleDelete(eventId: string) {
    setConfirmDeleteId(eventId);
    setContextMenu(null);
  }

  /**
   * Thực sự xóa sau khi người dùng xác nhận.
   */
  function confirmDelete() {
    if (!confirmDeleteId) return;

    setEvents((prev) => prev.filter((event) => event.id !== confirmDeleteId));

    setConfirmDeleteId(null);
  }

  /**
   * Edit
   */
  function handleEdit() {
    if (!contextMenu) return;

    const event = events.find((event) => event.id === contextMenu.eventId);

    if (!event) return;

    setSelectedEvent(event);
    setDialogMode("edit");
    setContextMenu(null);
  }

  function closeDialog() {
    setSelectedEvent(null);
    setDialogMode(null);
  }

  /**
   * Click vào header ngày → mở Day view.
   */
  function handleDayClick(day: Date) {
    setDayViewDate(day);
    setContextMenu(null);
  }

  /**
   * Chọn một event trong Day view → xem chi tiết.
   */
  function handleDayViewSelect(event: CalendarEvent) {
    setDayViewDate(null);
    handleEventClick(event);
  }

  /**
   * Tạo sự kiện mới trong một ngày cụ thể (từ Day view).
   * Mặc định 09:00–10:00 để có duration hợp lệ.
   */
  function handleCreateInDay(day: Date) {
    const startDateTime = new Date(day);

    startDateTime.setHours(9, 0, 0, 0);

    const endDateTime = new Date(day);

    endDateTime.setHours(10, 0, 0, 0);

    const newEvent: CalendarEvent = {
      id: crypto.randomUUID(),
      title: "",
      description: "",
      startDateTime,
      endDateTime,
    };

    setDayViewDate(null);
    setSelectedEvent(newEvent);
    setDialogMode("create");
  }

  return (
    <div className="calendar-app" onClick={() => setContextMenu(null)}>
      <CalendarHeader days={days} onDayClick={handleDayClick} />

      <CalendarBody
        days={days}
        events={events}
        onEventClick={handleEventClick}
        onEventContextMenu={handleEventContextMenu}
        onTimeSelection={handleTimeSelection}
        onMoveEvent={handleMoveEvent}
      />

      {selectedEvent && dialogMode && (
        <EventDialog
          mode={dialogMode}
          event={selectedEvent}
          onClose={closeDialog}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
        />
      )}

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onEdit={handleEdit}
          onDelete={() => handleDelete(contextMenu.eventId)}
        />
      )}

      {dayViewDate && !dialogMode && (
        <DayView
          day={dayViewDate}
          events={events}
          onClose={() => setDayViewDate(null)}
          onSelectEvent={handleDayViewSelect}
          onCreateEvent={handleCreateInDay}
        />
      )}

      {confirmDeleteId && (
        <ConfirmDialog
          title="Xóa sự kiện"
          message={`Bạn có chắc muốn xóa sự kiện "${
            events.find((event) => event.id === confirmDeleteId)?.title ||
            "(Không tiêu đề)"
          }"? Hành động này không thể hoàn tác.`}
          onConfirm={confirmDelete}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  );
}
