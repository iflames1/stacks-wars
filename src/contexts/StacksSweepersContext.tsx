import { createContext } from "react";

interface StacksSweepersContextType {}
const StacksSweepersContext = createContext<StacksSweepersContext | undefined>(
	undefined
);
