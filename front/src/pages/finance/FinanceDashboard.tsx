import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { financeApi } from '../../api/finance';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { DateRangePicker } from '../../components/common/DateRangePicker';
import { BranchSelector } from '../../components/common/BranchSelector';
import { DataTable } from '../../components/common/DataTable';
import { formatCurrency, formatDate } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';

export const FinanceDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date(),
  });
  const [selectedBranch, setSelectedBranch] = useState<string | undefined>();

  const { data: revenueData } = useQuery({
    queryKey: ['revenue-report', dateRange, selectedBranch],
    queryFn: () => financeApi.getRevenueReport({
      startDate: dateRange.from.toISOString(),
      endDate: dateRange.to.toISOString(),
      branchId: selectedBranch,
      groupBy: 'day',
    }),
  });

  const { data: outstandingData, isLoading: outstandingLoading, isError: outstandingError } = useQuery({
    queryKey: ['outstanding-receivables', selectedBranch],
    queryFn: () => financeApi.getOutstandingReceivables(selectedBranch),
  });

  const isAdmin = user?.role === 'SUPER_ADMIN';

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Finance Dashboard</h1>
        <div className="flex gap-4">
          {isAdmin && (
            <BranchSelector
              value={selectedBranch}
              onChange={setSelectedBranch}
              placeholder="All Branches"
            />
          )}
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(revenueData?.totalRevenue || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(outstandingData?.totalOutstanding || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Over 30 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(outstandingData?.byAging?.days30 || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Over 90 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-800">
              {formatCurrency(outstandingData?.byAging?.days90 || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenue Breakdown</TabsTrigger>
          <TabsTrigger value="outstanding">Outstanding Invoices</TabsTrigger>
          <TabsTrigger value="methods">Payment Methods</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <pre>{JSON.stringify(revenueData?.timeline, null, 2)}</pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outstanding">
          <Card>
            <CardHeader>
              <CardTitle>Outstanding Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                data={outstandingData?.invoices || []}
                columns={[
                  { key: 'invoiceNumber', header: 'Invoice #' },
                  { key: 'studentName', header: 'Student' },
                  { key: 'amount', header: 'Amount', render: (row) => formatCurrency(row.amount) },
                  { key: 'remaining', header: 'Remaining', render: (row) => formatCurrency(row.remaining) },
                  { key: 'dueDate', header: 'Due Date', render: (row) => formatDate(row.dueDate) },
                  { key: 'daysOverdue', header: 'Days Overdue' },
                ]}
                isLoading={outstandingLoading}
                isError={outstandingError}
                keyExtractor={(item) => item.id}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="methods">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>By Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.entries(revenueData?.byMethod || {}).map(([method, amount]) => (
                  <div key={method} className="flex justify-between py-2 border-b">
                    <span>{method}</span>
                    <span className="font-medium">{formatCurrency(Number(amount))}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>By Branch</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.entries(revenueData?.byBranch || {}).map(([branch, amount]) => (
                  <div key={branch} className="flex justify-between py-2 border-b">
                    <span>{branch}</span>
                    <span className="font-medium">{formatCurrency(Number(amount))}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinanceDashboard;