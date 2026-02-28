import {
  ActivityIndicator,
  Text,
  TouchableOpacity,
  type TouchableOpacityProps,
} from "react-native";

type Variant = "primary" | "secondary" | "danger";

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: Variant;
  isLoading?: boolean;
}

const variantStyles: Record<Variant, { bg: string; text: string }> = {
  primary: { bg: "bg-primary", text: "text-white" },
  secondary: { bg: "bg-gray-200 dark:bg-gray-700", text: "text-gray-800 dark:text-gray-100" },
  danger: { bg: "bg-danger", text: "text-white" },
};

export function Button({
  title,
  variant = "primary",
  isLoading = false,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const { bg, text } = variantStyles[variant];
  const isDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      {...props}
      disabled={isDisabled}
      className={`${bg} rounded-xl py-3 px-6 items-center justify-center ${isDisabled ? "opacity-60" : ""} ${className ?? ""}`}
    >
      {isLoading ? (
        <ActivityIndicator
          size="small"
          color={variant === "secondary" ? "#374151" : "#ffffff"}
        />
      ) : (
        <Text className={`${text} font-semibold text-base`}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}
