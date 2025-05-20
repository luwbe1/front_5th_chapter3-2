import { http, HttpResponse } from 'msw';

import { events } from '@/__mocks__/response/events.json' assert { type: 'json' };
import { Event } from '@/types';

export const handlers = [
  http.get('/api/events', () => {
    return HttpResponse.json({ events });
  }),

  http.post('/api/events', async ({ request }) => {
    const newEvent = (await request.json()) as Event;
    newEvent.id = String(events.length + 1);
    return HttpResponse.json(newEvent, { status: 201 });
  }),

  http.put('/api/events/:id', async ({ params, request }) => {
    const { id } = params;
    const updatedEvent = (await request.json()) as Event;
    const index = events.findIndex((event) => event.id === id);

    if (index !== -1) {
      return HttpResponse.json({ ...events[index], ...updatedEvent });
    }

    return new HttpResponse(null, { status: 404 });
  }),

  http.delete('/api/events/:id', ({ params }) => {
    const { id } = params;
    const index = events.findIndex((event) => event.id === id);

    if (index !== -1) {
      return new HttpResponse(null, { status: 204 });
    }

    return new HttpResponse(null, { status: 404 });
  }),

  http.post('/api/events-list', async ({ request }) => {
    const { events: newEvents } = (await request.json()) as { events: Event[] };
    console.log(newEvents);
    newEvents.forEach((_, index) => {
      newEvents[index].id = String(events.length + 1 + index);
    });
    return HttpResponse.json(newEvents, { status: 201 });
  }),

  http.put('/api/events-list', async ({ request }) => {
    let isUpdated = false;
    const newEvents = [...events];

    const { events: updatedEvents } = (await request.json()) as { events: Event[] };

    updatedEvents.forEach((event) => {
      const index = events.findIndex((target) => target.id === event.id);
      if (index > -1) {
        isUpdated = true;
        newEvents[index] = { ...events[index], ...event };
      }
    });

    if (isUpdated) return HttpResponse.json(newEvents);
    return new HttpResponse(null, { status: 404 });
  }),

  http.delete('/api/events-list', async ({ request }) => {
    const { eventIds } = (await request.json()) as { eventIds: Event['id'][] };

    const newEvents = events.filter((event) => !eventIds.includes(event.id));

    if (newEvents.length !== events.length) return new HttpResponse(null, { status: 204 });
    return new HttpResponse(null, { status: 404 });
  }),
];
