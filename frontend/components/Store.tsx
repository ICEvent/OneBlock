import React, { createContext, useContext, useReducer } from "react";

import { Actor, ActorSubclass, HttpAgent } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";

import ONEBLOCKService from "../api/profile/profile.did";
import RAMService from "../api/ram/ram.did";
import ATTENDNFTService from "../api/attendnft/attendnft.did";

import { Profile } from "../api/profile/profile.did";


import { defaultAgent } from "../lib/canisters";
import * as ONEBLOCK from "../api/profile/index";
import * as RAM from "../api/ram/index";
import * as ATTENDNFT from "../api/attendnft/index";

export type State = {
  agent: HttpAgent;
  oneblock: ActorSubclass<ONEBLOCKService._SERVICE>;
  ram: ActorSubclass<RAMService._SERVICE>;
  attendnft: ActorSubclass<ATTENDNFTService._SERVICE>;
  isAuthed: boolean;
  principal: Principal | null;
  profile: Profile | null;

};

const createActors = (agent: HttpAgent = defaultAgent) => ({
  oneblock: ONEBLOCK.createActor(agent),
  ram: RAM.createActor(agent,{ actorOptions: {} }),
  attendnft: ATTENDNFT.createActor(agent, { actorOptions: {} }),
});

const initialState: State = {
  ...createActors(),

  agent: defaultAgent,
  isAuthed: false,
  principal: null,
  profile: null
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
  }
  | {
    type: "SET_PROFILE";
    profile: Profile;
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
    case "SET_PRINCIPAL":
      return {
        ...state,
        principal: action.principal,
      };
    case "SET_PROFILE":
      return {
        ...state,
        profile: action.profile,
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

export const useRam = () => {
  const context = useGlobalContext();
  return context.state.ram;
};
export const useAttendNFT = () => {
  const context = useGlobalContext();
  return context.state.attendnft;
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

export const useProfile = () => {
  const { dispatch, state } = useGlobalContext();
  return {
    profile: state.profile,
    setProfile: (profile: Profile) => {
      dispatch({
        type: "SET_PROFILE",
        profile
      });
    }
  };
};
export default Store;
