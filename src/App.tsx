import { Route, Routes } from "react-router-dom";
import CoreApp from "./core/CoreApp";
import Home from "./home/Home";
import StoryPage from "./story/StoryPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/story" element={<StoryPage />} />
      <Route path="/*" element={<CoreApp />} />
    </Routes>
  );
}
