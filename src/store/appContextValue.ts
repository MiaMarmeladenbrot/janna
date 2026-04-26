import { createContext, type Dispatch } from 'react';
import type { AppState } from './types';
import type { AppAction } from './reducer';

export interface AppContextType {
  state: AppState;
  dispatch: Dispatch<AppAction>;
  loading: boolean;
  lastSaved: number;
}

export const AppContext = createContext<AppContextType | null>(null);
