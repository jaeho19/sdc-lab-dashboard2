import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function MembersLoading() {
  return (
    <div className="space-y-6 md:space-y-8">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-40 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Gantt Chart Skeleton */}
      <Card>
        <CardContent className="py-4">
          <Skeleton className="h-5 w-48 mb-4" />
          <Skeleton className="h-[200px] w-full rounded" />
        </CardContent>
      </Card>

      {/* Professor Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-1 rounded-full" />
          <Skeleton className="h-6 w-24" />
        </div>
        <div className="grid gap-3 md:gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pl-2 md:pl-4">
          <Card>
            <CardContent className="pt-4 md:pt-6 flex flex-col items-center">
              <Skeleton className="h-20 w-20 md:h-24 md:w-24 rounded-full mb-3" />
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-3 w-32 mb-3" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Full-Time Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-1 rounded-full" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-8" />
        </div>
        <div className="grid gap-3 md:gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 pl-2 md:pl-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-4 md:pt-6 flex flex-col items-center">
                <Skeleton className="h-20 w-20 md:h-24 md:w-24 rounded-full mb-3" />
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-3 w-32 mb-3" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
