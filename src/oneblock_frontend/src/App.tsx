import React from "react"
import { Principal } from "@dfinity/principal";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useParams,
} from "react-router-dom";


import Store from "./components/Store";

import 'react-toastify/dist/ReactToastify.css';
import { ProfilePage } from "./pages/Profile"
import  Home  from "./pages/Home";
import  Console  from "./pages/Console";
import  BlockPage  from "./pages/Block";
import PolicyEval from "./pages/PolicyEval";
import OipConsole from "./pages/OipConsole";

// Preserve legacy /:id block links while resolving canonical Principal URLs.
const PrincipalOrBlockPage = () => {
  const { id } = useParams<{ id: string }>();
  if (!id) return <BlockPage />;
  try {
    if (Principal.fromText(id).toText() === id) return <ProfilePage />;
  } catch {
    // Not a Principal: retain the existing block route.
  }
  return <BlockPage />;
};

export default () => {


  return (
    <BrowserRouter>
      <Store>
        <Routes>
          <Route path="/:id" element={<PrincipalOrBlockPage />} />
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
