import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AboutMe } from './components/AboutMe';
import { Docs } from './components/Docs';
import { Footer } from './components/Footer';
import { Hero } from './components/Hero';
import { Manifesto } from './components/Manifesto';
import { Navbar } from './components/Navbar';
import { ProductShot } from './components/ProductShot';

function LandingPage() {
  return (
    <>
      <Hero />
      <ProductShot />
      <Manifesto />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background text-foreground font-sans antialiased overflow-x-hidden selection:bg-purple-500/30">
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/docs" element={<Docs />} />
          <Route path="/about" element={<AboutMe />} />
        </Routes>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
