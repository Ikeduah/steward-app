"""drop orphaned teams/organization_settings schema and assets.estimated_value

These tables/column were created directly against the database outside of
Alembic (their originating migrations were empty no-op stubs) for a
teams/org-settings feature that was never actually wired into the app --
no model, schema, or router in the codebase references any of them.
Verified before dropping: teams and team_members are empty, the single
organization_settings row belongs to org_id 'org_test_manual' (manual QA
data, includes a literal test_key/test_val field), and estimated_value is
NULL on all rows in assets.

Revision ID: 0002
Revises: 0001
Create Date: 2026-07-15 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0002'
down_revision: Union[str, None] = '0001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column('assets', 'estimated_value')
    op.drop_table('team_members')
    op.drop_table('teams')
    op.drop_table('organization_settings')


def downgrade() -> None:
    op.create_table(
        'organization_settings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('org_id', sa.String(), nullable=False),
        sa.Column('settings', sa.JSON(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_table(
        'teams',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('org_id', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_by', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_table(
        'team_members',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('team_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.String(), nullable=False),
        sa.Column('role', sa.String(), nullable=True),
        sa.Column('added_by', sa.String(), nullable=False),
        sa.Column('added_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['team_id'], ['teams.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.add_column('assets', sa.Column('estimated_value', sa.Float(), nullable=True))
