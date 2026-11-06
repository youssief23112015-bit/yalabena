$content = @'
  private async sumDiscounts(from: Date, branchFilter?: string, to?: Date): Promise<number> {
    const qb = this.invoiceRepo.createQueryBuilder('i').select('COALESCE(SUM(i.discount_amount), 0)', 'total').where('i.created_at >= :from', { from });
    if (to) qb.andWhere('i.created_at <= :to', { to });
    if (branchFilter && branchFilter !== '__none__') qb.andWhere('i.branch_id = :b', { b: branchFilter });
    const row = await qb.getRawOne();
    return Number(row?.total ?? 0);
  }

  private async sumFinancialTx(from: Date, branchFilter?: string, to?: Date, direction: 'in' | 'out' = 'in'): Promise<number> {
    const qb = this.ftRepo.createQueryBuilder('ft').select('COALESCE(SUM(ft.amount), 0)', 'total').where('ft.transaction_date >= :from', { from }).andWhere('ft.direction = :dir', { dir: direction });
    if (to) qb.andWhere('ft.transaction_date <= :to', { to });
    if (branchFilter && branchFilter !== '__none__') qb.andWhere('ft.branch_id = :b', { b: branchFilter });
    const row = await qb.getRawOne();
    return Number(row?.total ?? 0);
  }

  private async avgInvoiceValue(branchFilter?: string): Promise<number> {
    const qb = this.invoiceRepo.createQueryBuilder('i').select('COALESCE(AVG(i.total_amount), 0)', 'avg');
    if (branchFilter && branchFilter !== '__none__') qb.andWhere('i.branch_id = :b', { b: branchFilter });
    const row = await qb.getRawOne();
    return Number(row?.avg ?? 0);
  }

  private async avgDaysToPay(branchFilter?: string): Promise<number> {
    const qb = this.paymentRepo.createQueryBuilder('p').innerJoin('p.invoice', 'i').select('COALESCE(AVG(EXTRACT(EPOCH FROM (p.paid_at - i.created_at)) / 86400), 0)', 'avg').where('p.status = :status', { status: 'completed' });
    if (branchFilter && branchFilter !== '__none__') qb.andWhere('i.branch_id = :b', { b: branchFilter });
    const row = await qb.getRawOne();
    return Number(row?.avg ?? 0);
  }
'@

$content | Add-Content -Path "c:\Users\WinDows\Desktop\yalabena-main\src\modules\dashboard\metrics\finance-metric.service.ts" -Encoding UTF8
Write-Output "Part 4 done"