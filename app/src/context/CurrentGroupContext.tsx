import React, { createContext, useContext } from "react";

interface CurrentGroupValue {
  groupId: string;
  groupName: string;
}

const CurrentGroupContext = createContext<CurrentGroupValue | undefined>(undefined);

export function CurrentGroupProvider({
  groupId,
  groupName,
  children,
}: CurrentGroupValue & { children: React.ReactNode }) {
  return (
    <CurrentGroupContext.Provider value={{ groupId, groupName }}>{children}</CurrentGroupContext.Provider>
  );
}

export function useCurrentGroup() {
  const ctx = useContext(CurrentGroupContext);
  if (!ctx) throw new Error("useCurrentGroup must be used within CurrentGroupProvider");
  return ctx;
}
