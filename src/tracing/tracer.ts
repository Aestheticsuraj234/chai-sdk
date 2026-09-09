export type TraceEvent = {
  type: string;
  data?: any;
  time: number;
  duration?: number;
};

export type TraceSpan = {
  end: (data?: any) => void;
  error: (err: unknown) => void;
};

export class Tracer {
  events: TraceEvent[] = [];

  log(type: string, data?: any, duration?: number) {
    const event: TraceEvent = { type, time: Date.now() };
    if (data !== undefined) event.data = data;
    if (duration !== undefined) event.duration = duration;
    this.events.push(event);
    return event;
  }

  startSpan(type: string, data?: any): TraceSpan {
    const startedAt = Date.now();
    this.log(`${type}.start`, data);

    return {
      end: (endData?: any) => {
        this.log(`${type}.end`, endData, Date.now() - startedAt);
      },
      error: (err: unknown) => {
        this.log(
          `${type}.error`,
          { error: err instanceof Error ? err.message : String(err) },
          Date.now() - startedAt,
        );
      },
    };
  }

  dump() {
    return this.events
      .map((e) => {
        const dur = e.duration != null ? ` ${e.duration}ms` : "";
        const data = e.data !== undefined ? ` ${JSON.stringify(e.data)}` : "";
        return `${e.type}${dur}${data}`;
      })
      .join("\n");
  }

  clear() {
    this.events = [];
  }
}
