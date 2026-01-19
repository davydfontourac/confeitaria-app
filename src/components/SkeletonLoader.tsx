interface SkeletonProps {
  className?: string;
}

const Skeleton = ({ className = '' }: SkeletonProps) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

interface RecipeCardSkeletonProps {
  count?: number;
}

const RecipeCardSkeleton = ({ count = 1 }: RecipeCardSkeletonProps) => {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse"
        >
          {/* Header skeleton */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="flex space-x-2 ml-4">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </div>

          {/* Stats skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="text-center">
                <Skeleton className="h-4 w-12 mx-auto mb-1" />
                <Skeleton className="h-3 w-16 mx-auto" />
              </div>
            ))}
          </div>

          {/* Tags skeleton */}
          <div className="flex flex-wrap gap-2 mb-4">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-6 w-16 rounded-full" />
            ))}
          </div>

          {/* Analysis badge skeleton */}
          <div className="flex justify-center">
            <Skeleton className="h-8 w-32 rounded-full" />
          </div>
        </div>
      ))}
    </>
  );
};

interface FormSkeletonProps {
  sections?: number;
}

const FormSkeleton = ({ sections = 4 }: FormSkeletonProps) => {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div className="text-center">
        <Skeleton className="h-8 w-64 mx-auto mb-2" />
        <Skeleton className="h-4 w-96 mx-auto" />
      </div>

      {/* Navigation tabs skeleton */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {Array.from({ length: sections }, (_, i) => (
          <Skeleton key={i} className="flex-1 h-10 rounded-md" />
        ))}
      </div>

      {/* Form content skeleton */}
      <div className="space-y-6">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
      </div>

      {/* Action buttons skeleton */}
      <div className="flex justify-between">
        <Skeleton className="h-10 w-32 rounded-lg" />
        <div className="flex space-x-4">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </div>
    </div>
  );
};

interface DashboardSkeletonProps {
  showStats?: boolean;
  recipeCount?: number;
}

const DashboardSkeleton = ({
  showStats = true,
  recipeCount = 6,
}: DashboardSkeletonProps) => {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div className="text-center">
        <Skeleton className="h-10 w-72 mx-auto mb-4" />
        <Skeleton className="h-5 w-96 mx-auto" />
      </div>

      {/* Stats skeleton */}
      {showStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center space-x-3">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="flex-1">
                  <Skeleton className="h-6 w-16 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters skeleton */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Skeleton className="h-10 flex-1 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
        <Skeleton className="h-10 w-24 rounded-lg" />
      </div>

      {/* Recipe cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <RecipeCardSkeleton count={recipeCount} />
      </div>
    </div>
  );
};

export default Skeleton;
export { RecipeCardSkeleton, FormSkeleton, DashboardSkeleton };
