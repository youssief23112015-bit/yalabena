$content = @'
  private async revenueTrend(branchFilter?: string, period: any = { from: new Date(), to: new Date() }): Promise<TimeSeriesPoint[]> {
    const qb = this.paymentRepo.createQueryBuilder('p').select("TO_CHAR(p.paid_at, 'YYYY-MM-DD')", 'date').addSelect('COALESCE(SUM(p.amount), 0)', 'value').where('p.status = :status', { status: 'completed' }).andWhere('p.paid_at >= :from', { from: period.from }).andWhere('p.paid_at <= :to', { to: period.to }).groupBy("TO_CHAR(p.paid_at, 'YYYY-MM-DD')").orderBy('date', 'ASC');
    if (branchFilter && branchFilter !== '__none__') qb.innerJoin('p.invoice', 'i').andWhere('i.branch_id = :b', { b: branchFilter });
    const rows = await qb.getRawMany();
    const map = new Map(rows.map((r: any) => [r.date, Number(r.value)]));
    const points: TimeSeriesPoint[] = [];
    const d = new Date(period.from);
    while (d <= period.to) {
      const key = d.toISOString().slice(0, 10);
      points.push({ date: key, value: map.get(key) ?? 0 });
      d.setDate(d.getDate() + 1);
    }
    return points;
  }

  private async revenueByPaymentMethod(branchFilter?: string, period: any = { from: new Date(), to: new Date() }): Promise<{ label: string; value: number }[]> {
    const qb = this.paymentRepo.createQueryBuilder('p').select('p.method', 'method').addSelect('COALESCE(SUM(p.amount), 0)', 'total').where('p.status = :status', { status: 'completed' }).andWhere('p.paid_at >= :from', { from: period.from }).andWhere('p.paid_at <= :to', { to: period.to }).groupBy('p.method');
    if (branchFilter && branchFilter !== '__none__') qb.innerJoin('p.invoice', 'i').andWhere('i.branch_id = :b', { b: branchFilter });
    const rows = await qb.getRawMany();
    return rows.map((r: any) => ({ label: String(r.method), value: Number(r.total) }));
  }

  private async incomeVsExpenses(branchFilter?: string, period: any = { from: new Date(), to: new Date() }): Promise<{ label: string; income: number; expense: number }[]> {
    const qb = this.ftRepo.createQueryBuilder('ft').select("TO_CHAR(ft.transaction_date, 'YYYY-MM')", 'month').addSelect("SUM(CASE WHEN ft.direction = 'in' THEN ft.amount ELSE 0 END)", 'income').addSelect("SUM(CASE WHEN ft.direction = 'out' THEN ft.amount ELSE 0 END)", 'expense').where('ft.transaction_date >= :from', { from: period.from }).andWhere('ft.transaction_date <= :to', { to: period.to }).groupBy("TO_CHAR(ft.transaction_date, 'YYYY-MM')").orderBy('month', 'ASC');
    if (branchFilter && branchFilter !== '__none__') qb.andWhere('ft.branch_id = :b', { b: branchFilter });
    const rows = await qb.getRawMany();
    return rows.map((r: any) => ({ label: String(r.month), income: Number(r.income), expense: Number(r.expense) }));
  }

  private async invoicesByStatus(branchFilter?: string, period: any = { from: new Date(), to: new Date() }): Promise<{ label: string; count: number; amount: number }[]> {
    const qb = this.invoiceRepo.createQueryBuilder('i').select('i.status', 'status').addSelect('COUNT(i.id)', 'count').addSelect('COALESCE(SUM(i.total_amount), 0)', 'amount').where('i.created_at >= :from', { from: period.from }).andWhere('i.created_at <= :to', { to: period.to }).groupBy('i.status');
    if (branchFilter && branchFilter !== '__none__') qb.andWhere('i.branch_id = :b', { b: branchFilter });
    const rows = await qb.getRawMany();
    return rows.map((r: any) => ({ label: String(r.status), count: Number(r.count), amount: Number(r.amount) }));
  }

  private async agingBuckets(branchFilter?: string): Promise<{ label: string; amount: number }[]> {
    const now = new Date();
    const dayMs = 24 * 60 * 60 * 1000;
    const buckets: { label: string; min: number; max: number; amount: number }[] = [
      { label: '0-30', min: 0, max: 30, amount: 0 },
      { label: '31-60', min: 31, max: 60, amount: 0 },
      { label: '61-90', min: 61, max: 90, amount: 0 },
      { label: '90+', min: 91, max: Infinity, amount: 0 },
    ];
    const qb = this.invoiceRepo.createQueryBuilder('i').select('i.balance_due', 'balance').addSelect('i.due_date', 'due_date').where("i.status IN (:...statuses)", { statuses: ['unpaid', 'partial', 'overdue'] });
    if (branchFilter && branchFilter !== '__none__') qb.andWhere('i.branch_id = :b', { b: branchFilter });
    const rows = await qb.getRawMany();
    for (const row of rows) {
      const balance = Number(row.balance);
      if (balance <= 0) continue;
      const dueDate = row.due_date ? new Date(row.due_date) : null;
      const daysOverdue = dueDate ? Math.floor((now.getTime() - dueDate.getTime()) / dayMs) : 0;
      for (const b of buckets) {
        if (daysOverdue >= b.min && daysOverdue <= b.max) { b.amount += balance; break; }
      }
    }
    return buckets.map(b => ({ label: b.label, amount: b.amount }));
  }
'@

$content | Add-Content -Path "c:\Users\WinDows\Desktop\yalabena-main\src\modules\dashboard\metrics\finance-metric.service.ts" -Encoding UTF8
Write-Output "Part 5 done"