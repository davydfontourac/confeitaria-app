interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  steps?: string[];
  className?: string;
  showLabels?: boolean;
}

const ProgressBar = ({
  currentStep,
  totalSteps,
  steps = [],
  className = '',
  showLabels = true,
}: ProgressBarProps) => {
  const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className={`w-full ${className}`}>
      {/* Progress bar container */}
      <div className="relative">
        {/* Background track */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          {/* Progress fill */}
          <div
            className="bg-gradient-to-r from-pink-500 to-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.max(progressPercentage, 0)}%` }}
          />
        </div>

        {/* Step indicators */}
        <div className="flex justify-between absolute -top-1 w-full">
          {Array.from({ length: totalSteps }, (_, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;

            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                  isCompleted
                    ? 'bg-blue-600 border-blue-600'
                    : isCurrent
                      ? 'bg-white border-blue-600 ring-2 ring-blue-600 ring-offset-2'
                      : 'bg-white border-gray-300'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Step labels */}
      {showLabels && steps.length === totalSteps && (
        <div className="flex justify-between mt-6">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            const isCompleted = stepNumber < currentStep;
            const isCurrent = stepNumber === currentStep;

            return (
              <div
                key={index}
                className={`text-xs font-medium transition-colors duration-300 ${
                  isCompleted || isCurrent ? 'text-blue-600' : 'text-gray-500'
                }`}
                style={{ maxWidth: `${100 / totalSteps}%` }}
              >
                <div className="text-center">
                  <span className="block">{step}</span>
                  <span className="text-gray-400 mt-1">
                    {stepNumber}/{totalSteps}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Simple percentage display */}
      {!showLabels && (
        <div className="text-center mt-3">
          <span className="text-sm font-medium text-blue-600">
            {Math.round(progressPercentage)}% concluído
          </span>
        </div>
      )}
    </div>
  );
};

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
  children?: React.ReactNode;
}

const CircularProgress = ({
  percentage,
  size = 120,
  strokeWidth = 8,
  color = '#3b82f6',
  backgroundColor = '#e5e7eb',
  showPercentage = true,
  children,
}: CircularProgressProps) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-out"
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children ||
          (showPercentage && (
            <span className="text-lg font-semibold text-gray-700">
              {Math.round(percentage)}%
            </span>
          ))}
      </div>
    </div>
  );
};

export default ProgressBar;
export { CircularProgress };
