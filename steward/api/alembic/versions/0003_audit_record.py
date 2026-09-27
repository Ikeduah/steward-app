"""audit record: add-only activity log, name snapshots, received_by, audit_exports

Step 2 of #17. Makes the record fit to export for an audit:

- activity_logs becomes add-only. A trigger rejects UPDATE, DELETE and
  TRUNCATE, so the rule holds for anything that reaches the database, not
  just the app.
- activity_logs.actor_name and the assignment *_name columns keep the name a
  person had at the time. Existing rows stay null; exports look those up.
- assignments.received_by records who took an item back. Backfilled for past
  returns from the checked_in log entry that closed each check-out.
- audit_exports records every export and is what the monthly limit counts.

Revision ID: 0003
Revises: 0002
Create Date: 2026-09-27 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0003'
down_revision: Union[str, None] = '0002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('activity_logs', sa.Column('actor_name', sa.String(), nullable=True))

    op.add_column('assignments', sa.Column('received_by', sa.String(), nullable=True))
    op.add_column('assignments', sa.Column('assigned_to_name', sa.String(), nullable=True))
    op.add_column('assignments', sa.Column('assigned_by_name', sa.String(), nullable=True))
    op.add_column('assignments', sa.Column('received_by_name', sa.String(), nullable=True))

    # An item can only be out to one person at a time, so the first check-in
    # of that item after a check-out began is the return that closed it.
    op.execute("""
        UPDATE assignments
        SET received_by = (
            SELECT l.actor_id
            FROM activity_logs l
            WHERE l.org_id = assignments.org_id
              AND l.asset_id = assignments.asset_id
              AND l.event_type = 'checked_in'
              AND l.created_at >= assignments.checked_out_at
            ORDER BY l.created_at ASC
            LIMIT 1
        )
        WHERE status = 'Returned' AND received_by IS NULL
    """)

    op.create_table(
        'audit_exports',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('org_id', sa.String(), nullable=False),
        sa.Column('requested_by', sa.String(), nullable=False),
        sa.Column('requested_by_name', sa.String(), nullable=True),
        sa.Column('report_type', sa.String(), nullable=False),
        sa.Column('format', sa.String(), nullable=False),
        sa.Column('range_start', sa.Date(), nullable=False),
        sa.Column('range_end', sa.Date(), nullable=False),
        sa.Column('asset_id', sa.Integer(), nullable=True),
        sa.Column('row_count', sa.Integer(), nullable=False),
        sa.Column('sha256', sa.String(length=64), nullable=False),
        sa.Column('counts_toward_limit', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_audit_exports_id'), 'audit_exports', ['id'], unique=False)
    op.create_index(op.f('ix_audit_exports_org_id'), 'audit_exports', ['org_id'], unique=False)
    op.create_index(op.f('ix_audit_exports_created_at'), 'audit_exports', ['created_at'], unique=False)

    if op.get_bind().dialect.name == 'postgresql':
        op.execute("""
            CREATE FUNCTION activity_logs_append_only() RETURNS trigger AS $$
            BEGIN
                RAISE EXCEPTION 'activity_logs is append-only: % is not allowed', TG_OP;
            END;
            $$ LANGUAGE plpgsql
        """)
        op.execute("""
            CREATE TRIGGER activity_logs_no_update_or_delete
            BEFORE UPDATE OR DELETE ON activity_logs
            FOR EACH ROW EXECUTE FUNCTION activity_logs_append_only()
        """)
        op.execute("""
            CREATE TRIGGER activity_logs_no_truncate
            BEFORE TRUNCATE ON activity_logs
            FOR EACH STATEMENT EXECUTE FUNCTION activity_logs_append_only()
        """)


def downgrade() -> None:
    if op.get_bind().dialect.name == 'postgresql':
        op.execute("DROP TRIGGER IF EXISTS activity_logs_no_truncate ON activity_logs")
        op.execute("DROP TRIGGER IF EXISTS activity_logs_no_update_or_delete ON activity_logs")
        op.execute("DROP FUNCTION IF EXISTS activity_logs_append_only()")

    op.drop_index(op.f('ix_audit_exports_created_at'), table_name='audit_exports')
    op.drop_index(op.f('ix_audit_exports_org_id'), table_name='audit_exports')
    op.drop_index(op.f('ix_audit_exports_id'), table_name='audit_exports')
    op.drop_table('audit_exports')

    op.drop_column('assignments', 'received_by_name')
    op.drop_column('assignments', 'assigned_by_name')
    op.drop_column('assignments', 'assigned_to_name')
    op.drop_column('assignments', 'received_by')

    op.drop_column('activity_logs', 'actor_name')
