'use client';

import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardHeader } from '@/shared/ui/card';
import type { AllActivities } from '../types';

interface AllActivitiesTabProps {
  allActivities: AllActivities;
  className?: string;
}

export function AllActivitiesTab({
  allActivities,
  className,
}: AllActivitiesTabProps) {
  const handlePageChange = (_page: number) => {};

  return (
    <div className={cn('space-y-4', className)}>
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-lg">Transaction Activities</h3>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-input border-b">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground text-sm">
                    Time
                  </th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground text-sm">
                    Wallet Address
                  </th>
                </tr>
              </thead>
              <tbody>
                {allActivities.recent_transactions.map((transaction, index) => (
                  <tr
                    key={index}
                    className="border-input/50 border-b transition-colors hover:bg-muted/50"
                  >
                    <td className="px-4 py-3">{transaction.time}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">
                          {transaction.wallet}
                        </span>
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-foreground"
                          aria-label="View transaction details"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handlePageChange(allActivities.pagination.current_page - 1)
              }
              disabled={allActivities.pagination.current_page === 1}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center gap-2">
              {Array.from(
                { length: allActivities.pagination.total_pages },
                (_, i) => i + 1
              ).map((page) => (
                <Button
                  key={page}
                  variant={
                    page === allActivities.pagination.current_page
                      ? 'default'
                      : 'outline'
                  }
                  size="sm"
                  onClick={() => handlePageChange(page)}
                  className="min-w-[40px]"
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handlePageChange(allActivities.pagination.current_page + 1)
              }
              disabled={
                allActivities.pagination.current_page ===
                allActivities.pagination.total_pages
              }
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
