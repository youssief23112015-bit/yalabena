import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * The academy pivots to 100% online: drop every branch_id column, the
 * branches table and the per-branch course pricing table.
 *
 * Notes:
 *  - The ledger trigger functions (log_payment_transaction /
 *    log_refund_transaction) are rewritten WITHOUT branch references so
 *    they keep working after invoices.branch_id / financial_transactions
 *    .branch_id are dropped.
 *  - stock_levels had a (item_id, branch_id) unique pair; per-branch rows
 *    are merged into ONE global row per item (quantities summed) before the
 *    branch_id column is dropped, then a unique (item_id) index is added.
 */
export class RemoveBranches1795000000000 implements MigrationInterface {
  name = 'RemoveBranches1795000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── 1. Rewrite ledger triggers without branch references ──
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION public.log_payment_transaction() RETURNS trigger
      LANGUAGE plpgsql AS $$
      BEGIN
        INSERT INTO financial_transactions (
            invoice_id, payment_id,
            transaction_type, direction, amount,
            transaction_date, description, created_by
        )
        VALUES (
            NEW.invoice_id, NEW.id,
            'payment', 'in', NEW.amount,
            NEW.paid_at, CONCAT('Payment ', COALESCE(NEW.receipt_number, '')), NEW.recorded_by
        );
        RETURN NEW;
      END;
      $$;
    `);
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION public.log_refund_transaction() RETURNS trigger
      LANGUAGE plpgsql AS $$
      BEGIN
        INSERT INTO financial_transactions (
            invoice_id, refund_id,
            transaction_type, direction, amount,
            transaction_date, description, created_by
        )
        VALUES (
            NEW.invoice_id, NEW.id,
            'refund', 'out', NEW.amount,
            COALESCE(NEW.processed_at, NOW()), CONCAT('Refund ', NEW.reason_code), NEW.processed_by
        );
        RETURN NEW;
      END;
      $$;
    `);

    // ── 2. Merge per-branch stock rows into ONE global row per item ──
    // Keep the oldest row per item and sum every branch's quantity into it.
    await queryRunner.query(`
      UPDATE stock_levels sl
      SET quantity = agg.total
      FROM (
        SELECT item_id, SUM(quantity)::int AS total
        FROM stock_levels
        GROUP BY item_id
        HAVING COUNT(*) > 1
      ) agg
      WHERE sl.id = (SELECT MIN(s2.id::text)::uuid FROM stock_levels s2 WHERE s2.item_id = agg.item_id);
    `);
    await queryRunner.query(`
      DELETE FROM stock_levels sl
      USING (
        SELECT item_id, MIN(id::text)::uuid AS keep_id
        FROM stock_levels
        GROUP BY item_id
      ) agg
      WHERE sl.item_id = agg.item_id AND sl.id <> agg.keep_id;
    `);

    // ── 3. Drop every branch_id column (FKs/indexes drop with the column) ──
    const tablesWithBranchColumn = [
      'users',
      'students',
      'leads',
      'lead_tags',
      'groups',
      'classrooms',
      'invoices',
      'financial_transactions',
      'activities',
      'stock_levels',
      'stock_moves',
      'student_item_issues',
      'waitlists',
      'test_slots',
    ];
    for (const table of tablesWithBranchColumn) {
await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "branch_id" CASCADE;`);    }

    // ── 4. Promo codes: branch scoping removed ──
    await queryRunner.query(`ALTER TABLE "promo_codes" DROP COLUMN IF EXISTS "applicable_branches"`);

    // ── 5. Exactly one stock row per item from now on ──
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_stock_levels_item_id" ON "stock_levels" ("item_id")`,
    );

    // ── 6. Drop the branch-only tables ──
    await queryRunner.query(`DROP TABLE IF EXISTS "course_branch_pricing" CASCADE`);
    await queryRunner.query(`DROP TABLE IF EXISTS "branches" CASCADE`);
  }

  public async down(): Promise<void> {
    // Branch scoping was removed permanently. Restoring it requires a full
    // pre-migration database restore — no down path is provided on purpose.
    throw new Error(
      'RemoveBranches migration is irreversible — restore from a pre-migration backup instead.',
    );
  }
}
