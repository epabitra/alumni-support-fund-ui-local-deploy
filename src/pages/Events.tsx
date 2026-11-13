import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import RoleBasedNav from '../components/RoleBasedNav';
import { useAuth } from '../app/modules/auth/core/Auth';
import { ROLE_ADMIN } from '../app/Constants';
import { getAdminEvents, getEvents } from '../app/modules/events/core/_requests';
import type { FundEventDTO } from '../app/modules/events/core/_models';
import { getFundBalance } from '../app/modules/payment/core/_requests';
import { EventFormModal, TransferModal } from '../components/events/EventModals';
import { EventProgress, EventStatusBadge, eventDates, LEFTOVER_NOTE, plainEventText } from '../components/events/EventBits';
import { formatINR } from '../components/ScholarshipPaymentModal';
import { EventCover } from '../components/events/EventImages';
import { ShareEventButton } from '../components/events/ShareEvent';
import '../styles/dashboard.css';
import '../styles/payment.css';
import '../styles/events.css';

const EventCard: React.FC<{ event: FundEventDTO }> = ({ event }) => {
  const canDonate = event.status === 'OPEN' && !event.collectionEnded;
  return (
    <article className={`event-card status-${event.status.toLowerCase()}`}>
      <Link to={`/events/${event.id}`} className="event-cover-link" tabIndex={-1} aria-hidden>
        <EventCover images={event.images} title={event.title} />
      </Link>
      <div className="event-card-top">
        <EventStatusBadge event={event} />
        <span className="event-card-dates">{eventDates(event)}</span>
      </div>
      <h3 className="event-card-title">
        <Link to={`/events/${event.id}`}>{event.title}</Link>
      </h3>
      {event.description && <p className="event-card-desc">{plainEventText(event.description)}</p>}
      <EventProgress event={event} />
      {event.status === 'DRAFT' && event.balance > 0 && (
        <p className="event-card-note">{formatINR(event.balance)} already set aside for this event</p>
      )}
      <div className="event-card-actions">
        <Link to={`/events/${event.id}`} className="btn btn-secondary btn-sm">View details</Link>
        {canDonate && <Link to={`/events/${event.id}#donate`} className="btn btn-primary btn-sm">Donate</Link>}
        <ShareEventButton event={event} />
      </div>
    </article>
  );
};

/**
 * Events members can donate to. Admins also see drafts (including money set aside for next year)
 * and can create events and move money between funds from here.
 */
const Events: React.FC = () => {
  const { currentUser } = useAuth();
  const isAdmin = !!currentUser?.authorities?.includes(ROLE_ADMIN);
  const navigate = useNavigate();
  const [events, setEvents] = useState<FundEventDTO[] | null>(null);
  const [error, setError] = useState('');
  const [general, setGeneral] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [moving, setMoving] = useState(false);

  const load = useCallback(() => {
    (isAdmin ? getAdminEvents() : getEvents())
      .then((list) => { setEvents(list); setError(''); })
      .catch((e) => setError(e?.response?.data?.message || 'Could not load events.'));
    if (isAdmin) getFundBalance().then((b) => setGeneral(b.generalFundBalance ?? null)).catch(() => {});
  }, [isAdmin]);

  useEffect(load, [load]);

  const open = events?.filter((e) => e.status === 'OPEN') ?? [];
  const drafts = events?.filter((e) => e.status === 'DRAFT') ?? [];
  const finished = events?.filter((e) => e.status === 'CLOSED' || e.status === 'CANCELLED') ?? [];

  return (
    <div className="dashboard-container">
      <RoleBasedNav />
      <main className="dashboard-content events-main">
        <div className="events-head">
          <div className="private-page-title-block">
            <h1>Events</h1>
            <p>Donate for a specific purpose. {LEFTOVER_NOTE}</p>
          </div>
          {isAdmin && (
            <div className="events-head-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setMoving(true)}>Move money</button>
              <button type="button" className="btn btn-primary" onClick={() => setCreating(true)}>+ New event</button>
            </div>
          )}
        </div>

        {error && <div className="payment-message error">{error}</div>}
        {!events && !error && <p className="events-loading">Loading events…</p>}

        {events && (
          <>
            <section aria-labelledby="events-open">
              <h2 id="events-open" className="events-section-title">Open for donations</h2>
              {open.length === 0 ? (
                <div className="payment-card events-empty">
                  <p>No events are open right now. You can still give to the General Fund, which pays for scholarships.</p>
                  <Link to="/contribute" className="btn btn-primary btn-sm">Contribute to the General Fund</Link>
                </div>
              ) : (
                <div className="event-grid">{open.map((e) => <EventCard key={e.id} event={e} />)}</div>
              )}
            </section>

            {isAdmin && drafts.length > 0 && (
              <section aria-labelledby="events-drafts">
                <h2 id="events-drafts" className="events-section-title">Drafts and upcoming</h2>
                <div className="event-grid">{drafts.map((e) => <EventCard key={e.id} event={e} />)}</div>
              </section>
            )}

            {finished.length > 0 && (
              <section aria-labelledby="events-finished">
                <h2 id="events-finished" className="events-section-title">Finished</h2>
                <div className="event-grid">{finished.map((e) => <EventCard key={e.id} event={e} />)}</div>
              </section>
            )}
          </>
        )}

        {creating && (
          <EventFormModal
            onClose={() => setCreating(false)}
            onSaved={(saved) => { setCreating(false); navigate(`/events/${saved.id}`); }}
          />
        )}
        {moving && events && (
          <TransferModal
            events={events}
            generalAvailable={general}
            onClose={() => setMoving(false)}
            onSaved={() => { setMoving(false); load(); }}
          />
        )}
      </main>
    </div>
  );
};

export default Events;
