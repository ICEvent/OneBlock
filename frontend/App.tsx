import React from "react"
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
} from "react-router-dom";



import { createClient } from "@connect2ic/core"
import { defaultProviders } from "@connect2ic/core/providers"
import { ConnectButton, ConnectDialog, Connect2ICProvider, useConnect } from "@connect2ic/react"
/*
 * Import canister definitions like this:
 */
import * as profile from "../.dfx/local/canisters/profile"
/*
 * Some examples to get you started
 */
import { Profile } from "./pages/Profile"
import { Home } from "./pages/Home";

function App() {


  return (
    <BrowserRouter>
     
      <Routes>
        <Route path="/:id" element={<Profile />} />
        <Route path="/" element={<Home />} />
        </Routes>
    </BrowserRouter>
   
      
  )
}

const client = createClient({
  canisters: {
    profile,
  },
  providers: defaultProviders,
  globalProviderConfig: {
    dev: import.meta.env.DEV,
  },
})

export default () => (
  <Connect2ICProvider client={client}>
    <App />
  </Connect2ICProvider>
)
