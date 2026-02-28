import { Text, View, type ViewProps } from "react-native";

interface CardProps extends ViewProps {
  title?: string;
  children: React.ReactNode;
}

export function Card({ title, children, className, ...props }: CardProps) {
  return (
    <View
      {...props}
      className={`bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 ${className ?? ""}`}
    >
      {title ? (
        <Text className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-3">
          {title}
        </Text>
      ) : null}
      {children}
    </View>
  );
}
