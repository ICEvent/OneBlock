import React from "react"
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
} from "react-router-dom";

// import * as profile from "./api/profile";

import Store from "./components/Store";
/*
 * Some examples to get you started
 */
import { Profile } from "./pages/Profile"
import { Home } from "./pages/Home";

export default () => {


  return (
    <BrowserRouter>
      <Store>
        <Routes>
          <Route path="/:id" element={<Profile />} />
          <Route path="/" element={<Home />} />
        </Routes>
      </Store>
    </BrowserRouter>


  )
}

