"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { clearUser, setUser } from "@/store/userSlice";

export const useAuthCheck = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const dispatch = useDispatch();

  useEffect(() => {

    const checkAuth = async () => {
      try {
        const response = await fetch("/api/verify-status", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });

        if (response.ok) {

            const userData = await response.json();

            const username = userData.user.username
            const email = userData.user.email
            const id = userData.user.id

            // set data to global state
            dispatch(setUser({username, email, id}))
            
            setIsAuthenticated(true);
            
        } else {

            // logout and push to login screen
            await fetch("/api/logout", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
            });

            // remove info from global state
            dispatch(clearUser());

            router.push("/")
            setIsAuthenticated(false);
          
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
      } finally {
        setIsLoading(false);

      }
    };

    checkAuth();

  }, [router]);

  return { isAuthenticated, isLoading};
};
