from sqlalchemy import Column, Integer, String, DateTime, Text, JSON, event
from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from app.core.db import Base
from app.core.people import display_name


class ActivityLogIsAppendOnly(Exception):
    """Raised on any attempt to change or remove a log entry."""


class ActivityLog(Base):
    """
    The permanent record. Rows are only ever added.

    That rule is enforced twice: by the listeners below, which cover the app
    and the SQLite tests, and by a Postgres trigger (migration 0003), which
    covers anything that reaches the database directly.
    """

    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(String, index=True, nullable=False)

    asset_id = Column(Integer, index=True, nullable=False)
    asset_name = Column(String, nullable=True) # Cache name for history if asset is deleted

    actor_id = Column(String, nullable=False) # Clerk User ID
    # Name at the time of the event, so the record survives the person leaving
    # or renaming. Null if Clerk could not be reached; exports look it up then.
    actor_name = Column(String, nullable=True)

    event_type = Column(String, nullable=False) # created, updated, checked_out, checked_in, retired, etc.
    details = Column(JSON, nullable=True) # { "previous_status": "...", "new_status": "..." }

    created_at = Column(DateTime(timezone=True), server_default=func.now())


@event.listens_for(ActivityLog, "before_insert")
def _snapshot_actor_name(_mapper, _connection, target):
    # Filled here rather than at each of the dozen call sites, so no event
    # type can be added without it.
    if target.actor_name is None:
        target.actor_name = display_name(target.actor_id)


@event.listens_for(ActivityLog, "before_update")
def _refuse_update(_mapper, _connection, target):
    raise ActivityLogIsAppendOnly(f"activity log entry {target.id} cannot be changed")


@event.listens_for(ActivityLog, "before_delete")
def _refuse_delete(_mapper, _connection, target):
    raise ActivityLogIsAppendOnly(f"activity log entry {target.id} cannot be removed")


@event.listens_for(Session, "do_orm_execute")
def _refuse_bulk_changes(state):
    # query(...).update() and .delete() skip the per-row hooks above.
    if not (state.is_update or state.is_delete):
        return
    if any(mapper.class_ is ActivityLog for mapper in state.all_mappers):
        raise ActivityLogIsAppendOnly("activity log entries cannot be changed or removed")
