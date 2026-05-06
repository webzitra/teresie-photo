import Nav from "./components/Nav";
import Hero from "./components/Hero";
import About from "./components/About";
import Services from "./components/Services";
import Portfolio from "./components/Portfolio";
import Contact from "./components/Contact";
import Footer from "./components/Footer";
import { BlockRenderer } from "./components/BlockRenderer";
import { getWebzitraBlocks } from "./lib/webzitra-content";

export default async function Home() {
  // Visual editor V2: when project_content.blocks is non-empty, render
  // the data-driven block tree. When empty (default for klients that
  // haven't been migrated yet), fall back to the legacy hardcoded
  // section ordering — both modes coexist so we can roll out per repo.
  //
  // V3 will let klients add/remove/reorder blocks from the editor;
  // until then blocks stay [] for everyone and this branch is dormant.
  const blocks = await getWebzitraBlocks();
  return (
    <>
      <Nav />
      <main className="flex-1">
        {blocks.length > 0 ? (
          <BlockRenderer blocks={blocks} />
        ) : (
          <>
            <Hero />
            <About />
            <Services />
            <Portfolio />
            <Contact />
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
