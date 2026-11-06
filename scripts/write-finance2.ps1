$content = @'
  private async sumPayments(from: Date, branchFilter?: string, to?: Date): Promise<number> {
    const qb = this.paymentRepo.createQueryBuilder('p').select('COALESCE(SUM(p.amount), 0)', 'total').where('p.status = :status', { status: 'completed' }).andWhere('p.paid_at >= :from', { from });
    if (to) qb.andWhere('p.paid_at <= :to', { to });
    if (branchFilter && branchFilter !== '__none__') qb.innerJoin('p.invoice', 'i').andWhere('i.branch_id = :b', { b: branchFilter });
    const row = await qb.getRawOne();
    return Number(row?.total ?? 0);
  }

  private async sumInvoiced(from: Date, branchFilter?: string, to?: Date): Promise<number> {
    const qb = this.invoiceRepo.createQueryBuilder('i').select('COALESCE(SUM(i.total_amount), 0)', 'total').where('i.created_at >= :from', { from });
    if (to) qb.andWhere('i.created_at <= :to', { to });
    if (branchFilter && branchFilter !== '__none__') qb.andWhere('i.branch_id = :b', { b: branchFilter });
    const row = await qb.getRawOne();
    return Number(row?.total ?? 0);
  }
'@

$content | Add-Content -Path "c:\Users\WinDows\Desktop\yalabena-main\src\modules\dashboard\metrics\finance-metric.service.ts" -Encoding UTF8
Write-Output "Part 2 done"