"""initial schema

Revision ID: 141f47f829e5
Revises: 
Create Date: 2026-04-01 16:47:13.111498

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '141f47f829e5'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "market_data",
        sa.Column("date", sa.Date(), primary_key=True),
        sa.Column("nifty", sa.Float()),
        sa.Column("vix", sa.Float()),
        sa.Column("gsec_10y", sa.Float()),
        sa.Column("gold_price", sa.Float()),
        sa.Column("usd_inr", sa.Float()),
        sa.Column("mc150m50", sa.Float()),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_table(
        "factors",
        sa.Column("date", sa.Date(), primary_key=True),
        sa.Column("nifty_200dma", sa.Float()),
        sa.Column("trend_signal", sa.Integer()),
        sa.Column("vix_20d_ma", sa.Float()),
        sa.Column("vol_signal", sa.Integer()),
        sa.Column("gsec_60d_ma", sa.Float()),
        sa.Column("liq_signal", sa.Integer()),
        sa.Column("dual_mom_signal", sa.Integer()),
        sa.Column("regime_score", sa.Integer()),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_table(
        "regime",
        sa.Column("date", sa.Date(), primary_key=True),
        sa.Column("regime", sa.String()),
        sa.Column("regime_score", sa.Integer()),
        sa.Column("confidence", sa.Float()),
        sa.Column("prev_regime", sa.String()),
        sa.Column("regime_changed", sa.Boolean(), default=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_table(
        "allocation",
        sa.Column("date", sa.Date(), primary_key=True),
        sa.Column("base_mom_weight", sa.Float()),
        sa.Column("vol_adj_mom_weight", sa.Float()),
        sa.Column("dual_mom_signal", sa.Integer(), default=0),
        sa.Column("meta_mom_weight", sa.Float()),
        sa.Column("gold_boost", sa.Float()),
        sa.Column("final_mom_weight", sa.Float()),
        sa.Column("final_gold_weight", sa.Float()),
        sa.Column("momentum_drawdown", sa.Float()),
        sa.Column("dd_adj_mom_weight", sa.Float()),
        sa.Column("dd_adj_gold_weight", sa.Float()),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_table(
        "performance",
        sa.Column("date", sa.Date(), primary_key=True),
        sa.Column("regime", sa.String()),
        sa.Column("mom_weight", sa.Float()),
        sa.Column("gold_weight", sa.Float()),
        sa.Column("momentum_return", sa.Float()),
        sa.Column("gold_return", sa.Float()),
        sa.Column("transaction_cost", sa.Float()),
        sa.Column("portfolio_return", sa.Float()),
        sa.Column("portfolio_nav", sa.Float()),
        sa.Column("portfolio_drawdown", sa.Float()),
        sa.Column("benchmark_nav", sa.Float()),
        sa.Column("gold_bh_nav", sa.Float()),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("performance")
    op.drop_table("allocation")
    op.drop_table("regime")
    op.drop_table("factors")
    op.drop_table("market_data")
