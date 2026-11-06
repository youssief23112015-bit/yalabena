$content = @'
  private async sumOutstanding(branchFilter?: string): Promise<number> {
    const qb = this.invoiceRepo.createQueryBuilder('i').select('COALESCE(SUM(i.balance_due), 0)', 'total').where("i.status IN (:...statuses)", { statuses: ['unpaid', 'partial', 'overdue'] });
    if (branchFilter && branchFilter !== '__none__') qb.andWhere('i.branch_id = :b', { b: branchFilter });
    const row = await qb.getRawOne();
    return Number(row?.total ?? 0);
  }

  private async sumOverdue(branchFilter?: string): Promise<number> {
    const qb = this.invoiceRepo.createQueryBuilder('i').select('COALESCE(SUM(i.balance_due), 0)', 'total').where('i.status = :status', { status: 'overdue' });
    if (branchFilter && branchFilter !== '__none__') qb.andWhere('i.branch_id = :b', { b: branchFilter });
    const row = await qb.getRawOne();
    return Number(row?.total ?? 0);
  }

  private async sumRefunds(from: Date, branchFilter?: string, to?: Date): Promise<number> {
    const qb = this.refundRepo.createQueryBuilder('r').select('COALESCE(SUM(r.amount), 0)', 'total').where("r.status IN (:...statuses)", { statuses: ['pending', 'approved'] }).andWhere('r.created_at >= :from', { from });
    if (to) qb.andWhere('r.created_at <= :to', { to });
    if (branchFilter && branchFilter !== '__none__') qb.innerJoin('r.invoice', 'i').andWhere('i.branch_id = :b', { b: branchFilter });
    const row = await qb.getRawOne();
    return Number(row?.total ?? 0);
  }

  private async countRefunds(from: Date, branchFilter?: string, to?: Date): Promise<number> {
    const qb = this.refundRepo.createQueryBuilder('r').select('COUNT(r.id)', 'total').where("r.status IN (:...statuses)", { statuses: ['pending', 'approved'] }).andWhere('r.created_at >= :from', { from });
    if (to) qb.andWhere('r.created_at <= :to', { to });
    if (branchFilter && branchFilter !== '__none__') qb.innerJoin('r.invoice', 'i').andWhere('i.branch_id = :b', { b: branchFilter });
    const row = await qb.getRawOne();
    return Number(row?.total ?? 0);
  }
'@

$content | Add-Content -Path "c:\Users\WinDows\Desktop\yalabena-main\src\modules\dashboard\metrics\finance-metric.service.ts" -Encoding UTF8
Write-Output "Part 3 done"