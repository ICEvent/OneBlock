import React, { createContext, useContext, useReducer } from "react";

import { Actor, ActorSubclass, HttpAgent } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";

import ONEBLOCKService from "../api/profile/profile.did";


import { defaultAgent } from "../lib/canisters";
import * as ONEBLOCK from "../api/profile/index";
import { CANISTER_ONEBLOCK } from "frontend/lib/constants";


export type State = {
  agent: HttpAgent;
  oneblock: ActorSubclass<ONEBLOCKService._SERVICE>; 
  isAuthed: boolean;
  principal: Principal | null;
 
};

const createActors = (agent: HttpAgent = defaultAgent) => ({
  oneblock: ONEBLOCK.createActor(agent,{ actorOptions: {} }),  
});

const initialState: State = {
  ...createActors(),
 
  agent: defaultAgent,
  isAuthed: false,
  principal: null,
 
};

type Action =
  | {
    type: "SET_AGENT";
    agent: HttpAgent | null;
    isAuthed?: boolean;
  }
  | {
    type: "SET_PRINCIPAL";
    principal: Principal;
  };



const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "SET_AGENT":
      const agent = action.agent || defaultAgent;
      return {
        ...state,
        ...createActors(agent),
        agent,
        isAuthed: !!action.isAuthed,
      };    
    default:
      return { ...state };

  }
};

const Context = createContext({
  state: initialState,
  dispatch: (_: Action) => null,
});

const Store = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <Context.Provider value={{ state, dispatch }}>{children}</Context.Provider>
  );
};

export const useGlobalContext = () => {
  const context = useContext(Context);
  if (context === undefined) {
    console.log("context is undefined")
    throw new Error("useGlobalContext must be used within a CountProvider");
  }
  return context;
};



export const useOneblock = () => {
  const context = useGlobalContext();
  return context.state.oneblock;
};

export const useSetAgent = () => {
  const { dispatch } = useGlobalContext();

  return async ({
    agent,
    isAuthed,
  }: {
    agent: HttpAgent;
    isAuthed?: boolean;
  }) => {
    dispatch({ type: "SET_AGENT", agent, isAuthed });

    if (isAuthed) {
      const principal = await agent.getPrincipal();
      console.log("authed", principal.toText());

      dispatch({
        type: "SET_PRINCIPAL",
        principal,
      });
    } else {
      dispatch({ type: "SET_PRINCIPAL", principal: null });
      console.log("not authed");
    }
  };
};


export default Store;
