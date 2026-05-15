import React from "react"
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
} from "react-router-dom";


import Store from "./components/Store";

import 'react-toastify/dist/ReactToastify.css';
import { ProfilePage } from "./pages/Profile"
import  Home  from "./pages/Home";
import  Console  from "./pages/Console";
import  BlockPage  from "./pages/Block";
import PolicyEval from "./pages/PolicyEval";
import OipConsole from "./pages/OipConsole";

export default () => {


  return (
    <BrowserRouter>
      <Store>
        <Routes>
          <Route path="/:id" element={<BlockPage />} />
          <Route path="/profile/:id" element={<ProfilePage />} />
          <Route path="/" element={<Home />} />
          <Route path="/console" element={<Console />} />
          <Route path="/policy" element={<PolicyEval />} />
          <Route path="/oip" element={<OipConsole />} />
        </Routes>
      </Store>
    </BrowserRouter>


  )
}
