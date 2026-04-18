import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom"; // <-- no BrowserRouter here
import Index from "./pages/Index";
import Encrypt from "./pages/Encrypt";
import Merge from "./pages/Merge";
import Compress from "./pages/Compress";
import Convert from "./pages/Convert";
import About from "./pages/About";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/encrypt" element={<Encrypt />} />
        <Route path="/merge" element={<Merge />} />
        <Route path="/compress" element={<Compress />} />
        <Route path="/convert" element={<Convert />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
