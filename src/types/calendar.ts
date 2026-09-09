export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  startDateTime: Date;
  endDateTime: Date;
}

export type DialogMode = "create" | "view" | "edit" | null;

export interface TimeSelection {
  day: Date;
  startMinutes: number;
  endMinutes: number;
}

export interface ContextMenuState {
  eventId: string;
  x: number;
  y: number;
}

export interface DragStartData {
  event: CalendarEvent;
  pointerOffsetMinutes: number;
}
