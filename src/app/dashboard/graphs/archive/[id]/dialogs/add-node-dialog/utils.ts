import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export const getOperatorsForType = (
  stateType: "NUMBER" | "BOOLEAN" | "TEXT"
) => {
  if (stateType === "NUMBER") {
    return [
      { value: "EQUALS", label: "Equals" },
      { value: "NOT_EQUALS", label: "Not Equals" },
      { value: "MORE_THAN", label: "Greater Than" },
      { value: "MORE_THAN_OR_EQUAL_TO", label: "Greater Than or Equal To" },
      { value: "LESS_THAN", label: "Less Than" },
      { value: "LESS_THAN_OR_EQUAL_TO", label: "Less Than or Equal To" },
    ];
  } else if (stateType === "BOOLEAN") {
    return [
      { value: "EQUALS", label: "Equals" },
      { value: "NOT_EQUALS", label: "Not Equals" },
    ];
  } else {
    return [
      { value: "EQUALS", label: "Equals" },
      { value: "NOT_EQUALS", label: "Not Equals" },
      { value: "CONTAINS", label: "Contains" },
      { value: "NOT_CONTAINS", label: "Not Contains" },
    ];
  }
};
