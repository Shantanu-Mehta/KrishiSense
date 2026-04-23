import React, { createContext, useState } from 'react';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [email, setemail] = useState(null);

 
  return (
    <UserContext.Provider value={{ email, setemail}}>
      {children}
    </UserContext.Provider>
  );
};
