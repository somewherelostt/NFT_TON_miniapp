"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

interface TelegramContextType {
  isTelegram: boolean;
  user?: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
  };
}

const TelegramContext = createContext<TelegramContextType>({
  isTelegram: false,
});

export const useTelegram = () => useContext(TelegramContext);

const TelegramProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isTelegram, setIsTelegram] = useState(false);
  const [user, setUser] = useState<TelegramContextType["user"]>();

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      (window as any).Telegram &&
      (window as any).Telegram.WebApp
    ) {
      setIsTelegram(true);
      const tg = (window as any).Telegram.WebApp;
      tg.ready && tg.ready();
      if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        setUser(tg.initDataUnsafe.user);
      }
    }
  }, []);

  return (
    <TelegramContext.Provider value={{ isTelegram, user }}>
      {isTelegram && (
        <div className="fixed top-2 right-2 z-50 bg-blue-700 text-white px-3 py-1 rounded shadow text-xs font-semibold">
          Telegram Mini App
          {user && (
            <span className="ml-2">
              {user.first_name}
              {user.last_name ? ` ${user.last_name}` : ""}
            </span>
          )}
        </div>
      )}
      {children}
    </TelegramContext.Provider>
  );
};

export default TelegramProvider;
