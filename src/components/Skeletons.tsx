import React from 'react';

export function CardSkeleton() {
  return (
    <div className="border border-border bg-card text-card-foreground rounded-xl p-6 shadow-xs animate-pulse">
      <div className="h-4 bg-muted rounded-md w-1/3 mb-4"></div>
      <div className="h-8 bg-muted rounded-md w-1/2 mb-2"></div>
      <div className="h-3 bg-muted rounded-md w-2/3"></div>
    </div>
  );
}

export function OverviewSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="border border-border bg-card text-card-foreground rounded-xl p-6 shadow-xs animate-pulse">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="h-4 bg-muted rounded-md w-28 mb-2"></div>
          <div className="h-3 bg-muted rounded-md w-48"></div>
        </div>
        <div className="h-8 bg-muted rounded-md w-20"></div>
      </div>
      <div className="h-64 bg-muted/50 rounded-lg w-full flex items-end p-4 space-x-2">
        <div className="bg-muted rounded-t-xs h-1/4 w-full"></div>
        <div className="bg-muted rounded-t-xs h-2/3 w-full"></div>
        <div className="bg-muted rounded-t-xs h-1/2 w-full"></div>
        <div className="bg-muted rounded-t-xs h-3/4 w-full"></div>
        <div className="bg-muted rounded-t-xs h-2/5 w-full"></div>
        <div className="bg-muted rounded-t-xs h-5/6 w-full"></div>
        <div className="bg-muted rounded-t-xs h-1/2 w-full"></div>
      </div>
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="border border-border bg-card rounded-xl p-4 shadow-xs animate-pulse">
      <div className="h-5 bg-muted rounded-md w-36 mb-4"></div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex justify-between items-center py-2 border-b border-border/50">
            <div className="space-y-1 w-1/3">
              <div className="h-4 bg-muted rounded-md w-full"></div>
              <div className="h-3 bg-muted rounded-md w-2/3"></div>
            </div>
            <div className="h-4 bg-muted rounded-md w-16"></div>
            <div className="h-4 bg-muted rounded-md w-12"></div>
            <div className="h-6 bg-muted rounded-full w-16"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CourseGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border border-border bg-card rounded-xl overflow-hidden shadow-xs animate-pulse">
          <div className="h-40 bg-muted w-full"></div>
          <div className="p-5 space-y-3">
            <div className="h-3 bg-muted rounded-md w-1/4"></div>
            <div className="h-5 bg-muted rounded-md w-3/4"></div>
            <div className="h-4 bg-muted rounded-md w-full"></div>
            <div className="h-4 bg-muted rounded-md w-5/6"></div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <div className="h-3 bg-muted rounded-md w-1/6"></div>
                <div className="h-3 bg-muted rounded-md w-1/12"></div>
              </div>
              <div className="h-2 bg-muted rounded-full w-full"></div>
            </div>
            <div className="h-9 bg-muted rounded-md w-full pt-1"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
