"use client";

import { ModeToggle } from "@/components/ModeToggle";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
} from "@/components/ui/menubar";
import { useRouter } from "next/navigation";
import { useState } from "react";
import loadingGif from "@/assets/loading.gif";
import { useAuthCheck } from "@/lib/hooks";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDispatch } from "react-redux";
import { clearUser } from "@/store/userSlice";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@radix-ui/react-menubar";
import { ChessBoard } from "@/components/Board";
import * as Dialog from "@radix-ui/react-dialog";
import { disconnectSocket, getSocket } from "@/lib/socket";
import { useEffect } from "react";

interface MatchHistory {
  id: string;
  whitePlayerId: number;
  blackPlayerId: number;
  winnerId: number;
  createdAt: string;
  opponent: string;
  result: string;
}

export default function Main() {
  const router = useRouter();
  const { isLoading } = useAuthCheck();
  const dispatch = useDispatch();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [matchHistory, setMatchHistory] = useState<MatchHistory[]>([]);

  const user = useSelector((state: RootState) => state.user);

  useEffect(() => {
    const getUserGameHistory = async () => {
      const response = await fetch("/api/fetch-history", {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      console.log("GAME STUFF: ", data.games);
      console.log("DATE: ", data.games[0].createdAt);

      if (!response.ok) {
        // failed fetching history
      } else {
        setMatchHistory(
          data.games.map((game: MatchHistory) => ({
            ...game,
            createdAt: new Date(game.createdAt).toLocaleDateString(),
          }))
        );
      }
    };

    getUserGameHistory();
  }, []);

  const defaultProfileImage =
    "https://api.dicebear.com/7.x/avataaars/svg?seed=default&backgroundColor=b6e3f4";

  // logout user
  const handleLogout = async () => {
    await fetch("/api/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    // remove info from global state
    dispatch(clearUser());

    router.push("/");
  };

  // search for game once verified
  const handleSearchGame = async () => {
    try {
      const response = await fetch("/api/verify-status", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      // dont search + logout if not verified
      if (!response.ok) {
        await fetch("/api/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        // remove info from global state
        dispatch(clearUser());

        router.push("/");
        setIsSearching(false);

        // put in game search if verified
      } else {
        // establish socket connection
        const socket = getSocket();

        // immediately search for game
        socket.emit("searchForGame", {
          username: user.username,
          email: user.email,
          id: user.id,
        });
        setIsSearching(true);

        // listen for gameFound
        socket.on("gameFound", (data) => {
          // debug
          const roomId = data.gameInfo.id;

          // send to unique page
          router.push(`/home/game/${roomId}`);
          setIsSearching(false);
        });

        // listen for possible connection errors
        socket.on("connect_error", (err) => {
          console.error("Socket connection error:", err);
          setIsSearching(false);
        });
      }
    } catch (error) {
      console.error("Error searching for game:", error);
      setIsSearching(false);
    }
  };

  const handleCloseDialog = () => {
    disconnectSocket();
    setIsSearching(false);
  };

  // loading state
  if (isLoading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <img src={loadingGif.src} alt="Loading..." className="w-20 h-20" />
      </div>
    );
  // once loaded
  else {
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        {/* Menubar */}
        <div className="flex flex-row justify-end">
          <Menubar className="h-18">
            <ModeToggle />

            <MenubarMenu>
              <MenubarTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="User menu"
                  className="border border-gray-200 dark:border-gray-800
                 bg-white dark:bg-black text-black dark:text-white 
                 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                >
                  <User className="h-[1.2rem] w-[1.2rem]" />
                </Button>
              </MenubarTrigger>
              <MenubarContent>
                <MenubarItem onClick={() => setIsSheetOpen(true)}>
                  Profile
                </MenubarItem>
                <MenubarItem onClick={handleLogout}>Log Out</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        </div>

        <div className="flex justify-center my-4">
          <Button
            disabled={isSearching}
            onClick={() => handleSearchGame()}
            className="px-6 py-3 text-lg font-bold text-white bg-indigo-500 rounded-lg shadow-[0_4px_0_#4f46e5] hover:shadow-[0_2px_0_#4f46e5] active:shadow-none active:translate-y-1 transition"
          >
            Search for Game
          </Button>
        </div>

        <div className="flex-col flex-grow items-center justify-center ">
          <ChessBoard />
        </div>

        {/* show when searching for game */}
        <Dialog.Root
          open={isSearching}
          onOpenChange={(open) =>
            open ? setIsSearching(true) : handleCloseDialog()
          }
        >
          <Dialog.Overlay className="fixed inset-0 bg-black opacity-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-8 rounded-lg shadow-lg w-80">
            <Dialog.Title className="text-xl font-bold text-center">
              Searching for Game
            </Dialog.Title>
            <div className="flex justify-center items-center space-x-3 mt-6">
              <div className="w-6 h-6 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-lg font-medium text-indigo-500">
                Searching for an opponent...
              </span>
            </div>
          </Dialog.Content>
        </Dialog.Root>

        {/* profile sheet*/}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent className="w-full sm:max-w-md">
            <SheetHeader className="pb-6">
              <SheetTitle className="text-2xl font-bold">Profile</SheetTitle>
            </SheetHeader>

            <div className="space-y-6">
              {/* Profile Information with DIV-based avatar instead of Avatar component */}
              <div className="flex items-center space-x-4">
                <div className="h-20 w-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {/* User profile image with default fallback from dicebear */}
                  <img
                    src={defaultProfileImage}
                    alt={user.username || "User"}
                    onError={(e) => {
                      e.currentTarget.src = defaultProfileImage;
                    }}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="space-y-1">
                  <h2 className="text-xl font-bold">{user.username}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {user.email}
                  </p>
                </div>
              </div>

              <Separator />

              {/* Match History */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Match History</h3>
                <Card>
                  <CardHeader className="p-4 pb-0">
                    <div className="grid grid-cols-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                      <span>Opponent</span>
                      <span>Result</span>
                      <span>Date</span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      {matchHistory?.map((match, index) => (
                        <div
                          key={index}
                          className="grid grid-cols-3 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0"
                        >
                          <span className="text-sm">{match.opponent}</span>
                          <span
                            className={`text-sm font-semibold ${
                              match.winnerId === user.id
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {match.result}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {match.createdAt}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <SheetFooter className="mt-6">
              <Button
                className="w-full bg-indigo-600 text-white"
                onClick={() => setIsSheetOpen(false)}
              >
                Close
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    );
  }
}
