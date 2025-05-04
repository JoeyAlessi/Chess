"use client";
import { ModeToggle } from "@/components/ModeToggle";
import { Button } from "@/components/ui/button";
import { Menubar } from "@/components/ui/menubar";
import { HttpStatusCode } from "@/lib/utils";
import "dotenv/config";

import { Abril_Fatface } from "next/font/google";
import { useRouter } from "next/navigation";
import { useState } from "react";
import loadingGif from "@/assets/loading.gif";
import { useAuthCheck } from "@/lib/hooks";
import { useDispatch } from "react-redux";

const abril = Abril_Fatface({
  weight: "400",
  subsets: ["latin"],
});

export default function Home() {
  const [isCreatingAccount, setCreatingAccount] = useState<boolean>(false);
  const [isError, setError] = useState<string>("");
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthCheck();

  if (isAuthenticated && !isLoading) {
    router.push("/home");
  }

  const handleCreateAccount = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const username = formData.get("username") as string;

    // TODO (hash password) TODO

    try {
      const response = await fetch("/api/create-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, username }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error);
      }
      // success must be 201
      else if (response.status === HttpStatusCode.CREATED) {
        // clear error message
        setError("");

        // send to main
        router.push("/home");
      }
    } catch (error) {}
  };

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // display error
        setError(data.error);
      }
      // success must be 202
      else if (response.status === HttpStatusCode.ACCEPTED) {
        // clear error message
        setError("");

        //redirct
        router.push("/home");
      }
    } catch (error) {}
  };

  if (isLoading)
    return (
      <div className={`${abril.className} flex flex-col h-screen`}>
        <div className="flex flex-row justify-end">
          <Menubar className="h-18">
            <ModeToggle />
          </Menubar>
        </div>

        <div className="flex w-full h-1/4 items-center justify-center text-4xl font-bold">
          <p>
            Welcome to <span className="text-indigo-500">Chess</span>
          </p>
        </div>

        <div className="flex w-full h-1/2 items-center justify-center">
          <div className="flex flex-col w-[90%] sm:w-[80%] md:w-[60%] lg:w-[40%] xl:w-[30%] max-w-xl h-full bg-slate-500 dark:bg-slate-700 rounded-lg shadow-lg p-6">
            <div className="text-2xl font-semibold text-center mb-4 bg-gray-300 dark:bg-gray-600 h-6 w-1/2 mx-auto rounded animate-pulse"></div>

            <div className="flex flex-col space-y-6">
              <div className="flex flex-col">
                <div className="text-base font-medium mb-2 bg-gray-300 dark:bg-gray-600 h-4 w-20 rounded animate-pulse"></div>
                <div className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-600 rounded-md shadow-sm h-10 animate-pulse"></div>
              </div>

              <div className="flex flex-col">
                <div className="text-base font-medium mb-2 bg-gray-300 dark:bg-gray-600 h-4 w-20 rounded animate-pulse"></div>
                <div className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-gray-200 dark:bg-gray-600 rounded-md shadow-sm h-10 animate-pulse"></div>
              </div>

              <div className="flex justify-center">
                <div className="w-full py-2 bg-gray-300 dark:bg-gray-600 rounded-md h-10 animate-pulse"></div>
              </div>
            </div>

            <div className="flex justify-center mt-6">
              <img
                src={loadingGif.src}
                alt="Loading..."
                className="w-20 h-20"
              />
            </div>
          </div>
        </div>
      </div>
    );
  else {
    return (
      <div className={`${abril.className} flex flex-col h-screen`}>
        {/* Menubar */}
        <div className="flex flex-row justify-end">
          <Menubar className="h-18">
            <ModeToggle />
          </Menubar>
        </div>

        <div className="flex w-full h-1/4 items-center justify-center text-4xl font-bold">
          <p>
            Welcome to <span className="text-indigo-500">Chess</span>
          </p>
        </div>

        <div className="flex w-full h-1/2 items-center justify-center">
          <div className="flex flex-col w-3/4 md:w-1/3 h-full bg-slate-500 dark:bg-slate-700 rounded-lg shadow-lg p-6">
            <div className="text-2xl font-semibold text-center mb-4">
              {isCreatingAccount ? "Create Account" : "Log In"}
            </div>

            {/* form */}
            <form
              onSubmit={isCreatingAccount ? handleCreateAccount : handleLogin}
              className="flex flex-col space-y-6"
            >
              {/* email */}
              <div className="flex flex-col">
                <label className="text-base font-medium mb-2" htmlFor="email">
                  Email
                </label>
                <input
                  className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Enter your email..."
                />
              </div>

              {/* password */}
              <div className="flex flex-col">
                <label
                  className="text-base font-medium mb-2"
                  htmlFor="password"
                >
                  Password
                </label>
                <input
                  className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  type="password"
                  id="password"
                  name="password"
                  placeholder="Enter your password..."
                />
              </div>

              {/* username */}
              {isCreatingAccount ? (
                <div className="flex flex-col">
                  <label
                    className="text-base font-medium mb-2"
                    htmlFor="username"
                  >
                    Username
                  </label>
                  <input
                    className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    type="text"
                    id="username"
                    name="username"
                    placeholder="Enter your username..."
                  />
                </div>
              ) : (
                <div></div>
              )}

              {/* submit */}
              <div className="flex justify-center">
                <Button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 text-white hover:bg-indigo-500 rounded-md"
                >
                  {isCreatingAccount ? "Create" : "Log In"}
                </Button>
              </div>
            </form>

            {/* error messages */}
            <div className="flex flex-col items-center text-sm text-red-400 py-2">
              {isError === ""
                ? ""
                : `${isError}` || "An unknown error occured."}
            </div>

            {/* switch option */}

            <div className="text-sm text-center mt-6">
              {isCreatingAccount
                ? "Already have an account?"
                : "Don't have an account?"}
              <div
                onClick={() => {
                  setCreatingAccount(!isCreatingAccount);
                }}
                className="text-indigo-600 font-medium hover:underline cursor-pointer"
              >
                {isCreatingAccount ? "Sign In" : "Create Account"}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
