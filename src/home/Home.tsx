import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./Home.css";

const clip01 = new URL("./assets/medals-clip-01.mp4", import.meta.url).href;
const clip01Mobile = new URL("./assets/medals-clip-01-m.mp4", import.meta.url).href;
const clip02 = new URL("./assets/medals-clip-02.mp4", import.meta.url).href;
const clip02Mobile = new URL("./assets/medals-clip-02-m.mp4", import.meta.url).href;
const clip03 = new URL("./assets/medals-clip-03.mp4", import.meta.url).href;
const clip03Mobile = new URL("./assets/medals-clip-03-m.mp4", import.meta.url).href;
const clip04 = new URL("./assets/medals-clip-04.mp4", import.meta.url).href;
const clip04Mobile = new URL("./assets/medals-clip-04-m.mp4", import.meta.url).href;
const clip05 = new URL("./assets/medals-clip-05.mp4", import.meta.url).href;
const clip05Mobile = new URL("./assets/medals-clip-05-m.mp4", import.meta.url).href;
const poster01 = new URL("./assets/medals-clip-01-poster.jpg", import.meta.url).href;
const poster02 = new URL("./assets/medals-clip-02-poster.jpg", import.meta.url).href;
const poster03 = new URL("./assets/medals-clip-03-poster.jpg", import.meta.url).href;
const poster04 = new URL("./assets/medals-clip-04-poster.jpg", import.meta.url).href;
const poster05 = new URL("./assets/medals-clip-05-poster.jpg", import.meta.url).href;
const scene01 = new URL("./assets/medals-scene-01.webp", import.meta.url).href;
const scene02 = new URL("./assets/medals-scene-02.webp", import.meta.url).href;
const scene03 = new URL("./assets/medals-scene-03.webp", import.meta.url).href;
const scene04 = new URL("./assets/medals-scene-04.webp", import.meta.url).href;
const scene05 = new URL("./assets/medals-scene-05.webp", import.meta.url).href;

type Scene = {
  number: string;
  label: string;
  title: string;
  body: string;
  detail: string;
  clip: string;
  clipMobile: string;
  poster: string;
  still: string;
};

const scenes: Scene[] = [
  {
    number: "01",
    label: "The pile",
    title: "Unfold the treatment story.",
    body: "A case can begin as a thousand loose ends. MEDALS turns the record into a story you can see.",
    detail: "Messy records · Missing context · Too much paper",
    clip: clip01,
    clipMobile: clip01Mobile,
    poster: poster01,
    still: scene01,
  },
  {
    number: "02",
    label: "The fold",
    title: "Every record finds its place.",
    body: "Dirty chronologies become one clear, source-linked record—without asking the case to be perfect.",
    detail: "Dates normalized · Providers aligned · Sources retained",
    clip: clip02,
    clipMobile: clip02Mobile,
    poster: poster02,
    still: scene02,
  },
  {
    number: "03",
    label: "The seismograph",
    title: "The treatment pattern rises into view.",
    body: "See care intensity, pivotal treatment, and consequential silence in one honest contour.",
    detail: "Care intensity · Key events · Treatment gaps",
    clip: clip03,
    clipMobile: clip03Mobile,
    poster: poster03,
    still: scene03,
  },
  {
    number: "04",
    label: "The story",
    title: "Evidence becomes a story people can follow.",
    body: "Every chapter remains grounded in the underlying medical record and linked back to its source.",
    detail: "Clear chapters · Linked records · Jury-ready clarity",
    clip: clip04,
    clipMobile: clip04Mobile,
    poster: poster04,
    still: scene04,
  },
  {
    number: "05",
    label: "The handoff",
    title: "Ready for the next room.",
    body: "Carry the treatment story into review, negotiation, or trial.",
    detail: "Slides · PDF · Visual treatment story",
    clip: clip05,
    clipMobile: clip05Mobile,
    poster: poster05,
    still: scene05,
  },
];

export default function Home() {
  const [active, setActive] = useState(0);
  const [stillsOnly, setStillsOnly] = useState(false);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);
  const mediaRefs = useRef<(HTMLDivElement | null)[]>([]);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const loaded = useRef<boolean[]>(scenes.map(() => false));
  const ready = useRef<boolean[]>(scenes.map(() => false));
  const objectUrls = useRef<string[]>([]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const staticMode = reduce || Boolean(connection?.saveData);
    setStillsOnly(staticMode);
    if (staticMode) return;

    let disposed = false;
    let raf = 0;
    const phoneClass = Math.min(window.screen.width, window.screen.height) <= 600;

    const loadVideo = (index: number) => {
      if (index < 0 || index >= scenes.length || loaded.current[index]) return;
      loaded.current[index] = true;
      const source = phoneClass ? scenes[index].clipMobile : scenes[index].clip;
      fetch(source)
        .then((response) => response.ok ? response.blob() : Promise.reject(new Error("Video unavailable")))
        .then((blob) => {
          if (disposed) return;
          const video = videoRefs.current[index];
          if (!video) return;
          const url = URL.createObjectURL(blob);
          objectUrls.current.push(url);
          video.src = url;
          video.addEventListener("loadeddata", requestUpdate, { once: true });
          video.load();
        })
        .catch(() => { loaded.current[index] = false; });
    };

    const update = () => {
      raf = 0;
      const focus = window.innerHeight * 0.52;
      let current = 0;
      let progress = 0;

      sectionRefs.current.forEach((section, index) => {
        if (!section) return;
        const rect = section.getBoundingClientRect();
        if (rect.top <= focus && rect.bottom > focus) {
          current = index;
          progress = Math.min(1, Math.max(0, (focus - rect.top) / rect.height));
        } else if (rect.bottom <= focus) {
          current = Math.min(index + 1, scenes.length - 1);
        }
      });

      setActive((previous) => previous === current ? previous : current);
      loadVideo(current);
      if (progress > 0.48) loadVideo(current + 1);

      const seam = current < scenes.length - 1 ? Math.max(0, (progress - 0.88) / 0.12) : 0;
      mediaRefs.current.forEach((media, index) => {
        if (!media) return;
        const opacity = index === current ? 1 - seam : index === current + 1 ? seam : 0;
        media.style.opacity = String(opacity);
        media.style.visibility = opacity > 0 ? "visible" : "hidden";
      });

      const video = videoRefs.current[current];
      if (video && ready.current[current] && Number.isFinite(video.duration)) {
        const eased = progress * progress * (3 - 2 * progress);
        const target = Math.min(video.duration - 0.04, Math.max(0, eased * video.duration));
        if (!video.seeking && Math.abs(video.currentTime - target) > 0.035) video.currentTime = target;
      }
    };

    const requestUpdate = () => {
      if (!raf) raf = window.requestAnimationFrame(update);
    };

    loadVideo(0);
    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      disposed = true;
      if (raf) window.cancelAnimationFrame(raf);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      objectUrls.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrls.current = [];
      loaded.current = scenes.map(() => false);
      ready.current = scenes.map(() => false);
      videoRefs.current.forEach((video) => {
        if (!video) return;
        video.removeAttribute("src");
        video.classList.remove("is-ready");
      });
    };
  }, []);

  return (
    <main className={`medals-world${stillsOnly ? " is-stills" : ""}`}>
      <header className="medals-world__topbar">
        <Link to="/" className="medals-world__brand" aria-label="MEDALS home">
          <strong>MEDALS</strong>
          <span>Medical AI Legal Service</span>
        </Link>
        <Link to="/app" className="medals-world__top-cta">Open the workspace <span>↗</span></Link>
      </header>

      <section className="medals-world__motion" aria-label="The MEDALS treatment story">
        <div className="medals-world__stage">
          <div className="medals-world__media" aria-hidden="true">
            {scenes.map((scene, index) => (
              <div
                className="medals-world__scene"
                key={scene.number}
                ref={(node) => { mediaRefs.current[index] = node; }}
                style={{ opacity: index === 0 ? 1 : 0 }}
              >
                <img src={scene.poster} alt="" decoding="async" fetchPriority={index === 0 ? "high" : "auto"} />
                <video
                  ref={(node) => { videoRefs.current[index] = node; }}
                  muted
                  playsInline
                  preload="none"
                  poster={scene.poster}
                  onLoadedData={(event) => {
                    ready.current[index] = true;
                    event.currentTarget.classList.add("is-ready");
                  }}
                />
              </div>
            ))}
            <div className="medals-world__paper-grain" />
          </div>

          <div className="medals-world__copies">
            {scenes.map((scene, index) => (
              <article className={`medals-world__copy${active === index ? " is-active" : ""}`} key={scene.number}>
                <p className="medals-world__eyebrow"><span>{scene.number}</span>{scene.label}</p>
                <h1>{scene.title}</h1>
                <p className="medals-world__body">{scene.body}</p>
                <p className="medals-world__detail">{scene.detail}</p>
                {index === scenes.length - 1 && (
                  <div className="medals-world__actions">
                    <Link to="/app">Open the workspace <span>→</span></Link>
                    <small>Your case data stays in your browser.</small>
                  </div>
                )}
              </article>
            ))}
          </div>

          <nav className="medals-world__rail" aria-label="Story chapters">
            {scenes.map((scene, index) => (
              <button
                key={scene.number}
                className={active === index ? "is-active" : ""}
                onClick={() => sectionRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "center" })}
                aria-label={`Go to ${scene.label}`}
              >
                <span>{scene.number}</span><i />
              </button>
            ))}
          </nav>

          <p className="medals-world__hint"><span>Scroll to unfold</span><i /></p>
        </div>

        <div className="medals-world__track" aria-hidden="true">
          {scenes.map((scene, index) => (
            <div key={scene.number} ref={(node) => { sectionRefs.current[index] = node; }} />
          ))}
        </div>
      </section>

      <section className="medals-world__static" aria-label="The MEDALS treatment story">
        {scenes.map((scene, index) => (
          <article key={scene.number}>
            <img src={scene.still} alt="" loading={index === 0 ? "eager" : "lazy"} decoding="async" />
            <div>
              <p className="medals-world__eyebrow"><span>{scene.number}</span>{scene.label}</p>
              <h2>{scene.title}</h2>
              <p>{scene.body}</p>
              {index === scenes.length - 1 && (
                <div className="medals-world__actions">
                  <Link to="/app">Open the workspace <span>→</span></Link>
                  <small>Your case data stays in your browser.</small>
                </div>
              )}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
