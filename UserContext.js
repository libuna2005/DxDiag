import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from './supabase';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userStatus, setUserStatus] = useState("Active Resident"); // Bonus requirement

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Listen for auth changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ session, userStatus, setUserStatus, loading }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to use the context easily
export const useUser = () => useContext(UserContext);