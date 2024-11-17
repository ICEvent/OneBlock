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

export default () => {


  return (
    <BrowserRouter>
      <Store>
        <Routes>
          <Route path="/:id" element={<ProfilePage />} />
          <Route path="/" element={<Home />} />
          <Route path="/console" element={<Console />} />
        </Routes>
      </Store>
    </BrowserRouter>


  )
}

