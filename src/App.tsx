import { Route, Routes } from "react-router-dom";
import CoreApp from "./core/CoreApp";
import StoryPage from "./story/StoryPage";

export default function App() {
  return (
    <Routes>
      <Route path="/story" element={<StoryPage />} />
      <Route path="/*" element={<CoreApp />} />
    </Routes>
  );
}
