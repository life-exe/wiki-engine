import { createContext, useContext } from "react";

export const LangContext = createContext<string>("ru");

export const useLang = (): string => useContext(LangContext);
