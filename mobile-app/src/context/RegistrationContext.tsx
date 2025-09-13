import React, { createContext, useContext, useState } from "react";

interface RegistrationContextType {
  isRegistered: boolean;
  setIsRegistered: (value: boolean) => void;
}

const RegistrationContext = createContext<RegistrationContextType | undefined>(undefined);

export const RegistrationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isRegistered, setIsRegistered] = useState(false);
  return (
    <RegistrationContext.Provider value={{ isRegistered, setIsRegistered }}>
      {children}
    </RegistrationContext.Provider>
  );
};

export const useRegistration = () => {
  const context = useContext(RegistrationContext);
  if (!context) {
    throw new Error("useRegistration must be used within a RegistrationProvider");
  }
  return context;
};
