"""asset categories and subcategories

Adds the categories table (two levels: category -> subcategory) and an
optional assets.category_id. Purely additive: no existing row changes, every
existing asset starts uncategorized, and the previous app version keeps
working against the new schema, so this can run before the code deploys.

Revision ID: 0003
Revises: 0002
Create Date: 2026-11-07 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0003'
down_revision: Union[str, None] = '0002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _set_lock_timeout() -> None:
    # Give up rather than queue behind a busy table and block the live app.
    # SET LOCAL lasts until the end of Alembic's migration transaction.
    if op.get_bind().dialect.name == 'postgresql':
        op.execute("SET LOCAL lock_timeout = '5s'")


def upgrade() -> None:
    _set_lock_timeout()

    op.create_table(
        'categories',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('org_id', sa.String(), nullable=False),
        sa.Column('name', sa.String(length=60), nullable=False),
        sa.Column('parent_id', sa.Integer(), nullable=True),
        sa.Column('created_by', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint('parent_id IS NULL OR parent_id <> id', name='ck_categories_not_own_parent'),
        sa.ForeignKeyConstraint(['parent_id'], ['categories.id'], name='fk_categories_parent_id', ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_categories_id'), 'categories', ['id'], unique=False)
    op.create_index(op.f('ix_categories_org_id'), 'categories', ['org_id'], unique=False)
    op.create_index(op.f('ix_categories_parent_id'), 'categories', ['parent_id'], unique=False)
    # No duplicate names under one parent, ignoring case. COALESCE makes
    # top-level categories (parent_id NULL) collide with each other too.
    op.create_index(
        'uq_categories_org_parent_name',
        'categories',
        ['org_id', sa.text('COALESCE(parent_id, 0)'), sa.text('lower(name)')],
        unique=True,
    )

    op.add_column('assets', sa.Column('category_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_assets_category_id', 'assets', 'categories',
        ['category_id'], ['id'], ondelete='SET NULL',
    )
    op.create_index(op.f('ix_assets_category_id'), 'assets', ['category_id'], unique=False)


def downgrade() -> None:
    _set_lock_timeout()

    op.drop_index(op.f('ix_assets_category_id'), table_name='assets')
    op.drop_constraint('fk_assets_category_id', 'assets', type_='foreignkey')
    op.drop_column('assets', 'category_id')

    op.drop_index('uq_categories_org_parent_name', table_name='categories')
    op.drop_index(op.f('ix_categories_parent_id'), table_name='categories')
    op.drop_index(op.f('ix_categories_org_id'), table_name='categories')
    op.drop_index(op.f('ix_categories_id'), table_name='categories')
    op.drop_table('categories')
