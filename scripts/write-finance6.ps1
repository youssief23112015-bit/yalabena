$content = @'
  private async installmentsDue(branchFilter?: string): Promise<{ count: number; amount: number; rows: any[] }> {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const qb = this.installmentRepo.createQueryBuilder('i').innerJoin('i.invoice', 'inv').where('i.status = :status', { status: 'pending' }).andWhere('i.due_date >= :now', { now }).andWhere('i.due_date <= :week', { week: weekFromNow }).orderBy('i.due_date', 'ASC').take(10);
    if (branchFilter && branchFilter !== '__none__') qb.andWhere('inv.branch_id = :b', { b: branchFilter });
    const rows = await qb.getMany();
    const amount = rows.reduce((sum, r) => sum + Number(r.amount), 0);
    return { count: rows.length, amount, rows };
  }

  private async topDebtors(branchFilter?: string): Promise<{ label: string; amount: number; count: number }[]> {
    const qb = this.invoiceRepo.createQueryBuilder('i').innerJoin('i.student', 's').innerJoin('s.user', 'u').select('u.id', 'id').addSelect("u.first_name || ' ' || u.last_name", 'label').addSelect('COUNT(i.id)', 'count').addSelect('COALESCE(SUM(i.balance_due), 0)', 'amount').where("i.status IN (:...statuses)", { statuses: ['unpaid', 'partial', 'overdue'] }).andWhere('i.balance_due > 0').groupBy('u.id').orderBy('amount', 'DESC').take(10);
    if (branchFilter && branchFilter !== '__none__') qb.andWhere('i.branch_id = :b', { b: branchFilter });
    const rows = await qb.getRawMany();
    return rows.map((r: any) => ({ label: String(r.label), amount: Number(r.amount), count: Number(r.count) }));
  }

  private async refundsPending(branchFilter?: string): Promise<{ count: number; amount: number; rows: any[] }> {
    const qb = this.refundRepo.createQueryBuilder('r').innerJoin('r.invoice', 'inv').innerJoin('inv.student', 'st').innerJoin('st.user', 'u').where("r.status = :status", { status: 'pending' }).orderBy('r.created_at', 'ASC').take(10);
    if (branchFilter && branchFilter !== '__none__') qb.andWhere('inv.branch_id = :b', { b: branchFilter });
    const rows = await qb.getMany();
    const amount = rows.reduce((sum, r) => sum + Number(r.amount), 0);
    return { count: rows.length, amount, rows };
  }

  private async failedPendingPayments(branchFilter?: string): Promise<{ count: number; amount: number; rows: any[] }> {
    const qb = this.paymentRepo.createQueryBuilder('p').innerJoin('p.invoice', 'inv').where("p.method = :method", { method: 'EASYKASH' }).where("p.status IN (:...statuses)", { statuses: ['pending', 'failed'] }).orderBy('p.paid_at', 'DESC').take(10);
    if (branchFilter && branchFilter !== '__none__') qb.andWhere('inv.branch_id = :b', { b: branchFilter });
    const rows = await qb.getMany();
    const amount = rows.reduce((sum, r) => sum + Number(r.amount), 0);
    return { count: rows.length, amount, rows };
  }

  private async latestPayments(branchFilter?: string): Promise<any[]> {
    const qb = this.paymentRepo.createQueryBuilder('p').innerJoin('p.invoice', 'inv').innerJoin('p.recorder', 'rec').where('p.status = :status', { status: 'completed' }).orderBy('p.paid_at', 'DESC').take(10);
    if (branchFilter && branchFilter !== '__none__') qb.andWhere('inv.branch_id = :b', { b: branchFilter });
    const rows = await qb.getMany();
    return rows.map((p: any) => ({ id: p.id, amount: Number(p.amount), method: p.method, paid_at: p.paid_at, recorder: p.recorder ? `${p.recorder.first_name} ${p.recorder.last_name}` : 'Unknown' }));
  }
'@

$content | Add-Content -Path "c:\Users\WinDows\Desktop\yalabena-main\src\modules\dashboard\metrics\finance-metric.service.ts" -Encoding UTF8
Write-Output "Part 6 done"