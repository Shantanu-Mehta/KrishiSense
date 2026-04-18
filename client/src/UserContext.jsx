import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [email, setemail] = useState(null);

 
  return (
    <UserContext.Provider value={{ email, setemail}}>
      {children}
    </UserContext.Provider>
  );
};