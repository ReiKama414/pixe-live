import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  Link,
  NavLink,
  Route,
  Routes,
  useNavigate,
  useLocation,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowDown,
  ArrowRight,
  Bell,
  Check,
  ChevronDown,
  ChevronLeft,
  Code2,
  Crown,
  Flame,
  Gift,
  Heart,
  Home,
  Layers,
  Maximize,
  Menu,
  MessageCircle,
  Pause,
  Play,
  Radio,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Volume2,
  VolumeX,
  Wifi,
  X,
  Zap,
} from "lucide-react";
import { categories, creators, number, type Creator } from "./data";
import { Portrait } from "./Art";
import { RealtimeEngine } from "./realtime/RealtimeEngine";
import type { NetworkMode } from "./realtime/types";

type UserState = {
  followed: string[];
  toggle: (id: string) => void;
  coins: number;
  spend: (cost: number) => boolean;
  claim: () => void;
  claimed: boolean;
  notice: (text: string) => void;
};
const UserContext = createContext<UserState>(null!);
const useUser = () => useContext(UserContext);
function load<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* Session state remains available when storage is disabled. */
  }
}
function Avatar({ c, small = false }: { c: Creator; small?: boolean }) {
  return (
    <span
      className={`avatar ${small ? "small" : ""}`}
      style={{ borderColor: c.accent }}
    >
      <Portrait creator={c} />
    </span>
  );
}
function Follow({ c }: { c: Creator }) {
  const user = useUser();
  const yes = user.followed.includes(c.id);
  return (
    <button
      className={yes ? "button followed" : "button mint"}
      onClick={() => user.toggle(c.id)}
    >
      {yes ? <Check size={15} /> : <Heart size={15} />}{" "}
      {yes ? "Following" : "Follow"}
    </button>
  );
}
function App() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);
  const [followed, setFollowed] = useState<string[]>(() =>
    load("pixelive-followed", ["yuki", "miko", "luna"]),
  );
  const [coins, setCoins] = useState<number>(() =>
    load("pixelive-coins", 1250),
  );
  const [claimed, setClaimed] = useState(
    () => load("pixelive-claim", "") === new Date().toDateString(),
  );
  const [toast, setToast] = useState("");
  const [menu, setMenu] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    save("pixelive-followed", followed);
  }, [followed]);
  useEffect(() => {
    save("pixelive-coins", coins);
  }, [coins]);
  const user: UserState = {
    followed,
    coins,
    claimed,
    notice: setToast,
    toggle: (id) =>
      setFollowed((old) =>
        old.includes(id) ? old.filter((x) => x !== id) : [...old, id],
      ),
    spend: (cost) => {
      if (coins < cost) {
        setToast(
          "Not enough demo coins. Claim your daily reward in your profile!",
        );
        return false;
      }
      setCoins((old) => old - cost);
      return true;
    },
    claim: () => {
      if (claimed) return;
      setCoins((old) => old + 500);
      setClaimed(true);
      save("pixelive-claim", new Date().toDateString());
      setToast("Daily reward claimed! +500 demo coins ✦");
    },
  };
  return (
    <UserContext.Provider value={user}>
      <div className="app-shell">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            aria-label="Toggle navigation"
            onClick={() => setMenu(!menu)}
          >
            <Menu size={22} />
          </button>
          <Link to="/" className="brand">
            <span className="pixel-mark">P</span> PIXELIVE
            <span className="brand-star">✦</span>
          </Link>
          <span className="brand-tag">YOUR WORLD. LIVE.</span>
          <form
            className="global-search"
            onSubmit={(e) => {
              e.preventDefault();
              navigate(`/search?q=${encodeURIComponent(search)}`);
            }}
          >
            <Search size={17} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Find your next obsession..."
              aria-label="Search creators, streams and categories"
            />
            <kbd>↵</kbd>
          </form>
          <span className="top-online">
            <span className="dot" /> A little more alive.
          </span>
          <div className="notification-wrap">
            <button
              className="icon-button notification-button"
              aria-label="Notifications"
              onClick={() => setNotifications(!notifications)}
            >
              <Bell size={19} />
              <i />
            </button>
            {notifications && (
              <div className="notification-pop">
                <b>Your little corner of the universe</b>
                <Link to="/live/yuki" onClick={() => setNotifications(false)}>
                  💚 Yuki is live — come say hello!
                </Link>
                <Link to="/me" onClick={() => setNotifications(false)}>
                  ✦ Your daily reward is waiting.
                </Link>
              </div>
            )}
          </div>
          <Link to="/me" className="profile-button">
            <span>✦</span>
            <b>LV. 08</b>
          </Link>
        </header>
        <aside className={`sidebar ${menu ? "open" : ""}`}>
          <div className="sidebar-section-label">EXPLORE</div>
          <nav onClick={() => setMenu(false)}>
            {[
              [Home, "For you", "/"],
              [Radio, "Live now", "/live"],
              [Users, "Creators", "/creators"],
              [Layers, "Categories", "/categories"],
              [Trophy, "Leaderboard", "/ranking"],
              [Play, "Clips", "/clips"],
            ].map(([Icon, title, url]) => {
              const I = Icon as typeof Home;
              return (
                <NavLink key={String(url)} to={String(url)} end={url === "/"}>
                  <I size={18} />
                  <span>{String(title)}</span>
                  {url === "/live" && <span className="nav-live-dot" />}
                  {url === "/ranking" && <span className="tiny-new">NEW</span>}
                </NavLink>
              );
            })}
          </nav>
          <div className="sidebar-divider" />
          <div className="sidebar-section-label label-row">
            YOUR UNIVERSE <Heart size={12} />
          </div>
          <NavLink to="/following" className="following-link">
            <Heart size={17} /> Following <span>{followed.length}</span>
          </NavLink>
          <div className="following-list">
            {creators
              .filter((c) => followed.includes(c.id))
              .slice(0, 5)
              .map((c) => (
                <Link to={`/live/${c.id}`} key={c.id}>
                  <Avatar c={c} small />
                  <span>
                    <strong>
                      {c.name}
                      <span className="jp-name">{c.jp}</span>
                    </strong>
                    <small>
                      {categories.find((x) => x.slug === c.category)?.name}
                    </small>
                  </span>
                  <i className="dot" />
                </Link>
              ))}
          </div>
          <Link to="/creators" className="discover-link">
            Discover your people <ArrowRight size={13} />
          </Link>
          <div className="sidebar-bottom">
            <div className="daily-card">
              <span className="daily-icon">✦</span>
              <strong>A little gift for showing up.</strong>
              <p>Your daily dose of pixel magic.</p>
              <button onClick={user.claim}>
                {claimed ? "Reward claimed ✓" : "Claim 500 coins"}
                <ArrowRight size={14} />
              </button>
            </div>
            <div className="sidebar-foot">
              <span className="dot" /> ALL SYSTEMS COZY <span>v.1.0</span>
            </div>
          </div>
        </aside>
        <main className="main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/live" element={<ExplorePage kind="live" />} />
            <Route path="/live/:id" element={<LiveRoute />} />
            <Route path="/creators" element={<ExplorePage kind="creators" />} />
            <Route path="/creator/:username" element={<CreatorPage />} />
            <Route path="/categories" element={<CategoryPage />} />
            <Route
              path="/category/:slug"
              element={<ExplorePage kind="category" />}
            />
            <Route path="/ranking" element={<RankingPage />} />
            <Route path="/clips" element={<ClipsPage />} />
            <Route
              path="/following"
              element={<ExplorePage kind="following" />}
            />
            <Route path="/search" element={<ExplorePage kind="search" />} />
            <Route path="/me" element={<MePage />} />
            <Route
              path="*"
              element={
                <div className="empty-state">
                  <h1>This pixel drifted away.</h1>
                  <Link className="button mint" to="/">
                    Back to your universe
                  </Link>
                </div>
              }
            />
          </Routes>
          <footer className="page-footer">
            <span>
              PIXELIVE <span>— a little internet, a lot of heart.</span>
            </span>
            <span>Made for your kind of weird. ✦</span>
          </footer>
        </main>
        {toast && (
          <div className="toast" role="status">
            <Sparkles size={18} />
            {toast}
            <button
              className="icon-button"
              aria-label="Dismiss notification"
              onClick={() => setToast("")}
            >
              <X size={15} />
            </button>
          </div>
        )}
      </div>
    </UserContext.Provider>
  );
}
function SectionHeading({
  eyebrow,
  title,
  subtitle,
  href,
  action = "View all",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {href && (
        <Link to={href}>
          {action} <ArrowRight size={15} />
        </Link>
      )}
    </div>
  );
}
function StreamCard({ c }: { c: Creator }) {
  return (
    <article className="stream-card">
      <Link to={`/live/${c.id}`} className={`stream-thumb scene-${c.category}`}>
        <Portrait creator={c} scene />
        <span className="live-badge">
          <span /> LIVE
        </span>
        <span className="viewers-badge">
          <Users size={11} />
          {number(c.viewers)}
        </span>
        <span className="thumb-play">
          <Play size={25} fill="currentColor" />
        </span>
      </Link>
      <div className="stream-info">
        <Link to={`/creator/${c.username}`}>
          <Avatar c={c} small />
        </Link>
        <div>
          <Link to={`/live/${c.id}`} className="stream-title">
            {c.title}
          </Link>
          <Link to={`/creator/${c.username}`} className="creator-name">
            {c.name}
            <ShieldCheck size={12} />
            <span>LV.{c.level}</span>
          </Link>
          <div className="stream-tags">
            <Link to={`/category/${c.category}`}>
              {categories.find((x) => x.slug === c.category)?.name}
            </Link>
            <span>{c.language}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
function HomePage() {
  const [filter, setFilter] = useState("all");
  const filtered =
    filter === "all"
      ? creators.slice(1, 5)
      : creators.filter((c) => c.category === filter).slice(0, 4);
  return (
    <>
      <div className="welcome-line">
        <span>
          <span className="dot" /> YOUR DAILY ESCAPE IS ONLINE
        </span>
        <span>
          こんにちは、friend <span className="sparkle">✧</span>
        </span>
      </div>
      <section className="hero">
        <img
          src={`${import.meta.env.BASE_URL}yuki-studio.png`}
          alt="Yuki in her neon mint streaming studio"
        />
        <div className="hero-shade" />
        <div className="hero-content">
          <div className="hero-kicker">
            <span className="live-badge">
              <span /> LIVE NOW
            </span>
            <span>FEATURED CREATOR</span>
          </div>
          <h1>
            Your next
            <br />
            obsession
            <br />
            is <em>live.</em>
            <span className="headline-spark">✦</span>
          </h1>
          <p>
            Find your people. Stay for the chaos.
            <br />A whole universe of creators, just one click away.
          </p>
          <div className="hero-actions">
            <Link to="/live/yuki" className="button mint">
              <Play size={15} fill="currentColor" /> Jump into the stream{" "}
              <ArrowRight size={16} />
            </Link>
            <Link to="/creators" className="hero-explore">
              Explore creators <ArrowRight size={15} />
            </Link>
          </div>
          <div className="hero-social">
            <div className="stacked-avatars">
              {creators.slice(1, 5).map((c) => (
                <Avatar key={c.id} c={c} small />
              ))}
            </div>
            <span>
              <b>12.8K</b> people found their corner. Find yours.
            </span>
          </div>
        </div>
        <Link to="/creator/yuki" className="hero-creator">
          <Avatar c={creators[0]} />
          <div>
            <span className="hero-creator-name">
              Yuki <ShieldCheck size={15} />
              <small>雪</small>
            </span>
            <span>Cozy chaos & midnight conversations</span>
          </div>
          <span className="hero-level">LV.42</span>
        </Link>
        <div className="on-air-sticker">
          <Radio size={16} /> ON AIR <span>♡</span>
        </div>
        <span className="hero-coordinate">35°40′ N · PIXEL UNIVERSE</span>
      </section>
      <div className="universe-strip">
        <span>
          <span className="dot" />
          <strong>It’s a good time to be here.</strong>
        </span>
        <span>
          <Radio size={15} />
          <b>248</b> creators live
        </span>
        <span>
          <Users size={15} />
          <b>86.4K</b> hanging out
        </span>
        <span className="strip-last">
          <Heart size={15} /> Infinite main-character energy{" "}
          <Sparkles size={15} />
        </span>
      </div>
      <section className="live-section">
        <SectionHeading
          title="Live, and a little unhinged."
          subtitle="Good streams. Great company. Your kind of energy."
          href="/live"
          action="Explore live"
        />
        <div className="filter-row">
          {[{ slug: "all", name: "For you", icon: "✦" }, ...categories].map(
            (c) => (
              <button
                className={filter === c.slug ? "filter active" : "filter"}
                key={c.slug}
                onClick={() => setFilter(c.slug)}
              >
                <span>{c.icon}</span>
                {c.name}
              </button>
            ),
          )}
          <span className="live-count">
            <span className="dot" /> HAPPENING NOW
          </span>
        </div>
        <div className="stream-grid">
          {filtered.map((c) => (
            <StreamCard key={c.id} c={c} />
          ))}
        </div>
      </section>
      <section className="category-section">
        <SectionHeading
          title="Pick your rabbit hole."
          subtitle="There’s a whole world behind every click."
          href="/categories"
          action="All categories"
        />
        <div className="category-grid">
          {categories.map((cat, i) => (
            <Link
              to={`/category/${cat.slug}`}
              key={cat.slug}
              className="category-tile"
              style={{ "--accent": cat.color } as React.CSSProperties}
            >
              <div className="category-art">
                <span className="category-big-icon">{cat.icon}</span>
                <span className="category-orbit">✧</span>
                <span className="category-code">0{i + 1}</span>
              </div>
              <div>
                <strong>{cat.name}</strong>
                <span>
                  <span className="dot" />
                  {cat.viewers} watching
                </span>
              </div>
              <ArrowRight size={16} />
            </Link>
          ))}
        </div>
      </section>
      <section className="community-banner">
        <div className="community-symbol">✳</div>
        <div>
          <span className="eyebrow">LESS SCROLLING. MORE BELONGING.</span>
          <h2>Not just a viewer. Part of the story.</h2>
          <p>
            Find your favorites, level up your fandom, and make yourself at
            home.
          </p>
        </div>
        <Link to="/following" className="button">
          Find your universe <ArrowRight size={16} />
        </Link>
        <span className="banner-star">✧</span>
      </section>
      <section>
        <SectionHeading
          title="Meet your next favorite."
          subtitle="Big personalities. Very real connections."
          href="/creators"
        />
        <div className="creator-mini-grid">
          {creators.slice(5, 9).map((c) => (
            <Link to={`/creator/${c.id}`} key={c.id} className="creator-mini">
              <Avatar c={c} />
              <div>
                <b>
                  {c.name} <span>{c.jp}</span>
                </b>
                <small>
                  LV.{c.level} · {number(c.followers)} friends
                </small>
              </div>
              <ArrowRight size={16} />
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
function ExplorePage({
  kind,
}: {
  kind: "live" | "creators" | "category" | "following" | "search";
}) {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const query = params.get("q") || "";
  const user = useUser();
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("recommended");
  let list = creators
    .filter((c) => kind !== "following" || user.followed.includes(c.id))
    .filter((c) => kind !== "category" || c.category === slug)
    .filter((c) => kind !== "live" || c.live)
    .filter((c) => filter === "all" || c.category === filter)
    .filter(
      (c) =>
        kind !== "search" ||
        `${c.name} ${c.username} ${c.title} ${c.category}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    );
  if (sort === "viewers")
    list = [...list].sort((a, b) => b.viewers - a.viewers);
  const title =
    kind === "following"
      ? "Your people, right here."
      : kind === "creators"
        ? "Meet your next favorite."
        : kind === "search"
          ? `Results for “${query}”`
          : kind === "category"
            ? categories.find((c) => c.slug === slug)?.name ||
              "Unknown category"
            : "The universe is live.";
  return (
    <>
      <div className="page-intro">
        <div className="eyebrow">YOUR NEXT CHAPTER STARTS HERE</div>
        <h1>{title}</h1>
        <p>
          {list.length} {kind === "creators" ? "unique creators" : "streams"} to
          make yourself at home in.
        </p>
      </div>
      <div className="filter-row">
        <button
          className={filter === "all" ? "filter active" : "filter"}
          onClick={() => setFilter("all")}
        >
          ✦ All vibes
        </button>
        {categories.map((c) => (
          <button
            key={c.slug}
            className={filter === c.slug ? "filter active" : "filter"}
            onClick={() => setFilter(c.slug)}
          >
            {c.icon} {c.name}
          </button>
        ))}
        <select
          aria-label="Sort creators"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="recommended">Recommended</option>
          <option value="viewers">Most viewers</option>
        </select>
      </div>
      {list.length ? (
        <div className="stream-grid browse-grid">
          {list.map((c) =>
            kind === "creators" ? (
              <article className="creator-profile-card" key={c.id}>
                <Link to={`/creator/${c.id}`}>
                  <Portrait creator={c} scene />
                </Link>
                <div>
                  <Avatar c={c} />
                  <h3>
                    <Link to={`/creator/${c.id}`}>
                      {c.name} <span>{c.jp}</span>
                    </Link>
                  </h3>
                  <p>{c.title}</p>
                  <span className="muted">
                    LV.{c.level} · {number(c.followers)} friends
                  </span>
                  <Follow c={c} />
                </div>
              </article>
            ) : (
              <StreamCard key={c.id} c={c} />
            ),
          )}
        </div>
      ) : (
        <div className="empty-state">
          <Search size={32} />
          <h2>No streams in this little corner yet.</h2>
          <p>Try another vibe or discover someone new.</p>
          <Link className="button mint" to="/creators">
            Explore creators <ArrowRight size={16} />
          </Link>
        </div>
      )}
    </>
  );
}
function CategoryPage() {
  return (
    <>
      <div className="page-intro">
        <div className="eyebrow">FOLLOW YOUR CURIOSITY</div>
        <h1>Pick your rabbit hole.</h1>
        <p>
          From boss fights to soft goodnights. There’s a place for you here.
        </p>
      </div>
      <div className="category-page-grid">
        {categories.map((cat) => (
          <Link
            to={`/category/${cat.slug}`}
            className="category-large"
            key={cat.slug}
            style={{ "--accent": cat.color } as React.CSSProperties}
          >
            <span>{cat.icon}</span>
            <h2>{cat.name}</h2>
            <p>{cat.description}</p>
            <small>
              {cat.viewers} watching <ArrowRight size={17} />
            </small>
          </Link>
        ))}
      </div>
    </>
  );
}
function CreatorPage() {
  const { username } = useParams();
  const c = creators.find((x) => x.username === username);
  if (!c) return <NotFound />;
  return (
    <>
      <div
        className="creator-cover"
        style={{ "--accent": c.accent } as React.CSSProperties}
      >
        {c.id === "yuki" ? (
          <img
            src={`${import.meta.env.BASE_URL}yuki-studio.png`}
            alt="Yuki's streaming studio"
          />
        ) : (
          <Portrait creator={c} scene />
        )}
        <span>WELCOME TO MY LITTLE UNIVERSE ✧</span>
      </div>
      <div className="creator-profile-header">
        <Avatar c={c} />
        <div>
          <div className="eyebrow">LV.{c.level} VIRTUAL CREATOR</div>
          <h1>
            {c.name} <span>{c.jp}</span>
            <ShieldCheck size={24} />
          </h1>
          <p>
            {number(c.followers)} friends · {c.language}
          </p>
        </div>
        <Follow c={c} />
        <Link className="button mint" to={`/live/${c.id}`}>
          <Radio size={16} /> Enter live room
        </Link>
      </div>
      <div className="profile-columns">
        <section className="panel">
          <h2>A little about me</h2>
          <p>
            Hey, I’m {c.name}! {c.title}. This is our little corner of the
            internet for good company, spontaneous adventures, and being
            unapologetically ourselves.
          </p>
          <p>Grab a drink, get comfy, and stay a while. ♡</p>
          <div className="stream-tags">
            <span>{c.language}</span>
            <Link to={`/category/${c.category}`}>{c.category}</Link>
          </div>
        </section>
        <section className="panel">
          <h2>Your fan journey</h2>
          <div className="stat-grid">
            <div>
              <b>82%</b>
              <span>Affinity</span>
            </div>
            <div>
              <b>128</b>
              <span>Day streak</span>
            </div>
            <div>
              <b>S</b>
              <span>Fan rank</span>
            </div>
          </div>
          <div className="progress-track">
            <i style={{ width: "82%" }} />
          </div>
          <p>Keep showing up. Little moments become great memories.</p>
        </section>
      </div>
      <SectionHeading title="More of your kind of energy" />
      <div className="stream-grid">
        {creators
          .filter((x) => x.id !== c.id)
          .slice(0, 4)
          .map((x) => (
            <StreamCard c={x} key={x.id} />
          ))}
      </div>
    </>
  );
}
function RankingPage() {
  const [metric, setMetric] = useState<"viewers" | "followers">("viewers");
  const list = [...creators].sort((a, b) => b[metric] - a[metric]);
  return (
    <>
      <div className="page-intro">
        <div className="eyebrow">THE PEOPLE’S MAIN CHARACTERS</div>
        <h1>A little legendary.</h1>
        <p>
          Big moments, devoted communities, and creators worth cheering for.
        </p>
      </div>
      <div className="filter-row">
        <button
          className={`filter ${metric === "viewers" ? "active" : ""}`}
          onClick={() => setMetric("viewers")}
        >
          🔥 Live viewers
        </button>
        <button
          className={`filter ${metric === "followers" ? "active" : ""}`}
          onClick={() => setMetric("followers")}
        >
          ♡ Biggest communities
        </button>
      </div>
      <div className="ranking-list">
        {list.map((c, i) => (
          <div key={c.id} className="ranking-row">
            <span className={`rank rank-${i}`}>
              {i < 3 ? <Crown size={23} /> : String(i + 1).padStart(2, "0")}
            </span>
            <Link to={`/creator/${c.id}`}>
              <Avatar c={c} />
            </Link>
            <Link to={`/creator/${c.id}`} className="ranking-name">
              <b>
                {c.name} <span>{c.jp}</span>
              </b>
              <small>{c.title}</small>
            </Link>
            <span className="rank-level">LV.{c.level}</span>
            <strong>
              {number(c[metric])}
              <small>{metric}</small>
            </strong>
            <Follow c={c} />
          </div>
        ))}
      </div>
    </>
  );
}
function ClipsPage() {
  const [active, setActive] = useState<Creator | null>(null);
  return (
    <>
      <div className="page-intro">
        <div className="eyebrow">SMALL CLIPS. BIG FEELINGS.</div>
        <h1>You had to be there.</h1>
        <p>The laughs, the wins, and the wonderfully unexpected.</p>
      </div>
      <div className="stream-grid browse-grid">
        {creators.slice(0, 12).map((c, i) => (
          <article className="stream-card" key={c.id}>
            <button
              className="stream-thumb clip-thumb"
              onClick={() => setActive(c)}
            >
              <Portrait creator={c} scene />
              <span className="clip-play">
                <Play fill="currentColor" />
              </span>
              <span className="viewers-badge">0:{24 + i * 2}</span>
            </button>
            <h3>
              {
                [
                  "The most chaotic 30 seconds of my life",
                  "Chat made me do it...",
                  "Wait. Did that actually just happen?",
                  "A tiny moment of pure happiness",
                ][i % 4]
              }
            </h3>
            <p className="muted">
              {c.name} · {number(12480 - i * 721)} views
            </p>
          </article>
        ))}
      </div>
      {active && (
        <div className="modal-backdrop" onClick={() => setActive(null)}>
          <div className="clip-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close icon-button"
              aria-label="Close clip"
              onClick={() => setActive(null)}
            >
              <X />
            </button>
            <div className="clip-animation">
              <Portrait creator={active} scene />
              <div className="clip-caption">
                {active.name}: “Chat, we are SO back!” ✨
              </div>
            </div>
            <h2>A little {active.name} highlight</h2>
            <p>
              Illustrated demo clip · discover the full experience in the live
              room.
            </p>
            <Link to={`/live/${active.id}`} className="button mint">
              Join the stream <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
function MePage() {
  const user = useUser();
  return (
    <>
      <div className="page-intro">
        <div className="eyebrow">PLAYER ONE, THAT’S YOU.</div>
        <h1>Your little universe.</h1>
        <p>Every hello is a little XP. Every stream is a new memory.</p>
      </div>
      <div className="profile-columns">
        <section className="panel fan-pass">
          <span className="eyebrow">PIXELIVE FAN PASS</span>
          <div className="fan-symbol">✦</div>
          <h2>Pixel wanderer</h2>
          <p>SUPER FAN LV.08</p>
          <div className="progress-track">
            <i style={{ width: "68%" }} />
          </div>
          <p>680 / 1,000 XP to your next adventure</p>
          <div className="stat-grid">
            <div>
              <b>{user.followed.length}</b>
              <span>Following</span>
            </div>
            <div>
              <b>12</b>
              <span>Day streak</span>
            </div>
            <div>
              <b>A</b>
              <span>Fan rank</span>
            </div>
          </div>
        </section>
        <section className="panel">
          <h2>A pocket full of possibility.</h2>
          <p>Your demo wallet. Send a little love to your favorite creators.</p>
          <div className="wallet-balance">
            ✦ {user.coins.toLocaleString()} <small>coins</small>
          </div>
          <button
            className="button mint"
            disabled={user.claimed}
            onClick={user.claim}
          >
            <Gift size={17} />
            {user.claimed
              ? "Daily reward claimed"
              : "Claim your daily 500 coins"}
          </button>
          <p className="muted">
            Demo coins only. No payments or real currency.
          </p>
          <h3>Achievements unlocked</h3>
          <div className="achievement-chips">
            <span>🌱 First hello</span>
            <span>💚 Found my people</span>
            <span>✨ Night owl</span>
          </div>
        </section>
      </div>
      <SectionHeading title="Your favorites" href="/following" />
      <div className="stream-grid">
        {creators
          .filter((c) => user.followed.includes(c.id))
          .map((c) => (
            <StreamCard key={c.id} c={c} />
          ))}
      </div>
    </>
  );
}
function NotFound() {
  return (
    <div className="empty-state">
      <h1>Creator not found.</h1>
      <Link to="/creators" className="button mint">
        Discover creators
      </Link>
    </div>
  );
}

function LiveRoute() {
  const { id } = useParams();
  const c = creators.find((x) => x.id === id);
  return c ? <LiveRoom key={id} c={c} /> : <NotFound />;
}
function LiveRoom({ c }: { c: Creator }) {
  const [engine, setEngine] = useState<RealtimeEngine | null>(null);
  useEffect(() => {
    const service = new RealtimeEngine();
    setEngine(service);
    void service.start();
    return () => service.dispose();
  }, [c.id]);
  return engine ? (
    <LiveRoomContent c={c} engine={engine} />
  ) : (
    <div className="empty-state">Opening your universe…</div>
  );
}
function LiveRoomContent({
  c,
  engine,
}: {
  c: Creator;
  engine: RealtimeEngine;
}) {
  const s = useSyncExternalStore(engine.subscribe, engine.getSnapshot);
  const user = useUser();
  const [input, setInput] = useState("");
  const [network, setNetwork] = useState(false);
  const [architecture, setArchitecture] = useState(false);
  const [danmaku, setDanmaku] = useState(true);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);
  const [giftOpen, setGiftOpen] = useState(false);
  const [quality, setQuality] = useState("Auto");
  const videoRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const queued = s.messages.filter((m) => m.status === "queued").length;
  const pending = s.messages.filter((m) => m.status === "pending").length;
  const offline = ["OFFLINE", "RECONNECTING"].includes(s.state);
  useEffect(() => {
    if (chatRef.current)
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [s.messages]);
  useEffect(() => {
    if (muted || paused || offline) {
      void audioRef.current?.suspend();
      return;
    }
    if (!audioRef.current) {
      const ctx = new AudioContext();
      const gain = ctx.createGain();
      gain.gain.value = 0.025;
      gain.connect(ctx.destination);
      [130.81, 164.81, 196].forEach((frequency) => {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = frequency;
        osc.connect(gain);
        osc.start();
      });
      audioRef.current = ctx;
    }
    void audioRef.current.resume();
  }, [muted, paused, offline]);
  useEffect(
    () => () => {
      void audioRef.current?.close();
    },
    [],
  );
  const send = (e: React.FormEvent) => {
    e.preventDefault();
    engine.send(input);
    setInput("");
  };
  return (
    <>
      <div className="room-breadcrumb">
        <Link to="/live">
          <ChevronLeft size={15} /> Explore live
        </Link>
        <span>/</span>
        <Link to={`/category/${c.category}`}>
          {categories.find((x) => x.slug === c.category)?.name}
        </Link>
        <button
          className={`sim-toggle ${network ? "selected" : ""}`}
          onClick={() => setNetwork(!network)}
        >
          <Settings2 size={15} /> Network simulator{" "}
          <span className="demo-tag">DEMO</span>
        </button>
      </div>
      <div className="room-layout">
        <section className="room-main">
          <div
            className={`video-stage ${paused ? "is-paused" : ""}`}
            data-quality={quality === "Auto" ? s.quality : quality}
            ref={videoRef}
          >
            {c.id === "yuki" ? (
              <img
                className="stage-art"
                src={`${import.meta.env.BASE_URL}yuki-studio.png`}
                alt="Yuki hosting a cozy illustrated stream"
              />
            ) : (
              <Portrait creator={c} scene />
            )}
            <div className="stage-vignette" />
            <div className="stage-top">
              <span className="live-badge">
                <span /> LIVE
              </span>
              <span className="stage-viewers">
                <Users size={13} />
                {s.viewers.toLocaleString()}
              </span>
              <span className="stage-demo">
                ILLUSTRATED STREAM · SIMULATED LIVE
              </span>
            </div>
            <div className="stream-overlay-title">
              <small>{c.name.toUpperCase()}’S LITTLE CORNER</small>
              <h2>
                Cozy hours.
                <br />
                <em>Chaotic company.</em>
              </h2>
              <span>いっしょに、のんびり ♡</span>
            </div>
            {danmaku && !paused && !offline && (
              <div className="danmaku" aria-hidden="true">
                {s.messages.slice(-3).map((m, i) => (
                  <span
                    key={m.id}
                    style={{
                      top: `${18 + i * 19}%`,
                      animationDelay: `${i * 0.4}s`,
                    }}
                  >
                    {m.text}
                  </span>
                ))}
              </div>
            )}
            {s.effect && (
              <div className="particle-field" aria-hidden="true">
                {Array.from({ length: 12 }, (_, i) => (
                  <span
                    key={`${s.effect}-${i}`}
                    style={{
                      left: `${8 + i * 7}%`,
                      animationDelay: `${i * 0.07}s`,
                    }}
                  >
                    {s.effect}
                  </span>
                ))}
              </div>
            )}
            {s.combo > 0 && (
              <div className="combo">
                <Gift size={18} /> GIFT COMBO <b>×{s.combo}</b>
              </div>
            )}
            {(offline || s.state === "SYNCING") && (
              <div className="signal-overlay" role="status">
                <Wifi size={35} />
                <h2>
                  {s.state === "SYNCING"
                    ? "SYNCING YOUR UNIVERSE..."
                    : "SIGNAL LOST!"}
                </h2>
                <p>
                  {s.state === "SYNCING"
                    ? "Recovering the moments you missed."
                    : "Hang tight. Your people are still here."}
                </p>
                <div className="recovery-progress">
                  <i />
                </div>
                <strong>
                  {s.state === "SYNCING"
                    ? "RECOVER · SYNC · RESTORE"
                    : `RECONNECTING · ATTEMPT ${String(s.attempt).padStart(2, "0")}`}
                </strong>
                {offline && (
                  <button
                    className="button mint"
                    onClick={() => engine.setMode("NORMAL")}
                  >
                    Restore connection <Zap size={15} />
                  </button>
                )}
              </div>
            )}
            {paused && !offline && (
              <button
                className="paused-overlay"
                onClick={() => setPaused(false)}
                aria-label="Resume stream"
              >
                <Play size={44} fill="currentColor" />
                <span>Stream paused</span>
              </button>
            )}
            <div className="video-controls">
              <button
                aria-label={paused ? "Play stream" : "Pause stream"}
                onClick={() => setPaused(!paused)}
              >
                {paused ? <Play size={18} /> : <Pause size={18} />}
              </button>
              <button
                aria-label={
                  muted ? "Enable ambient audio" : "Mute ambient audio"
                }
                onClick={() => setMuted(!muted)}
              >
                {muted ? <VolumeX size={19} /> : <Volume2 size={19} />}
              </button>
              <span className="live-control">
                <span className="dot" /> LIVE
              </span>
              <span className="video-spacer" />
              <button
                className={danmaku ? "control-active" : ""}
                aria-label="Toggle danmaku"
                title="Toggle floating chat"
                onClick={() => setDanmaku(!danmaku)}
              >
                <MessageCircle size={17} />
              </button>
              <select
                aria-label="Stream quality"
                value={quality}
                onChange={(e) => {
                  setQuality(e.target.value);
                  engine.notify(
                    e.target.value === "Auto"
                      ? "Adaptive quality enabled"
                      : `Manual quality: ${e.target.value}`,
                  );
                }}
              >
                <option value="Auto">Auto · {s.quality}</option>
                {["1080p", "720p", "480p", "360p"].map((q) => (
                  <option key={q}>{q}</option>
                ))}
              </select>
              <button
                aria-label="Fullscreen stream"
                onClick={() => {
                  if (document.fullscreenElement)
                    void document.exitFullscreen();
                  else
                    void videoRef.current
                      ?.requestFullscreen()
                      .catch(() =>
                        engine.notify(
                          "Fullscreen is unavailable in this browser.",
                        ),
                      );
                }}
              >
                <Maximize size={18} />
              </button>
            </div>
          </div>
          <div className="room-creator-row">
            <Link to={`/creator/${c.id}`}>
              <Avatar c={c} />
            </Link>
            <div>
              <h1>{c.title}</h1>
              <Link to={`/creator/${c.id}`} className="creator-name">
                {c.name}
                <ShieldCheck size={14} />
                <span>LV.{c.level}</span>
                <small>{c.jp}</small>
              </Link>
              <div className="stream-tags">
                <Link to={`/category/${c.category}`}>
                  {categories.find((x) => x.slug === c.category)?.name}
                </Link>
                <span>{c.language}</span>
                <span>Cozy vibes</span>
              </div>
            </div>
            <Follow c={c} />
          </div>
          <div className="room-action-bar">
            <button className="like-button" onClick={() => engine.react()}>
              <Heart size={18} /> {number(s.likes)} <span>Send some love</span>
            </button>
            <div className="gift-container">
              <button
                className="button pink"
                onClick={() => setGiftOpen(!giftOpen)}
              >
                <Gift size={17} /> Send a gift <ChevronDown size={14} />
              </button>
              {giftOpen && (
                <div className="gift-picker">
                  <b>A little love goes a long way.</b>
                  <small>✦ {user.coins} demo coins</small>
                  <div>
                    {[
                      ["💚", "Mint heart", 50],
                      ["🌸", "Sakura", 100],
                      ["✨", "Stardust", 150],
                      ["👑", "Pixel crown", 300],
                    ].map(([emoji, name, cost]) => (
                      <button
                        key={name}
                        onClick={() => {
                          if (user.spend(Number(cost))) {
                            engine.gift(String(emoji));
                            setGiftOpen(false);
                          }
                        }}
                      >
                        <span>{emoji}</span>
                        <b>{name}</b>
                        <small>✦ {cost}</small>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="fan-hud">
            <div>
              <Sparkles size={22} />
              <span>
                <b>SUPER FAN LV.{8 + Math.floor(s.xp / 500)}</b>
                <small>You’re part of the story.</small>
              </span>
            </div>
            <div className="fan-xp">
              <span>{s.xp % 500} / 500 XP</span>
              <div className="progress-track">
                <i style={{ width: `${(s.xp % 500) / 5}%` }} />
              </div>
            </div>
            <div>
              <Flame size={19} />
              <span>
                <b>128 DAY STREAK</b>
                <small>Affinity 82% · Fan rank S</small>
              </span>
            </div>
          </div>
          {s.recovered > 0 && !offline && s.state !== "SYNCING" && (
            <div className="recovered-banner" role="status">
              <Check size={18} />
              <div>
                <strong>CONNECTION RESTORED!</strong>
                <span>
                  +{s.recovery.chat} chat recovered · +{s.recovery.gifts} gifts
                  synced · +{s.recovery.reactions} reactions
                </span>
              </div>
            </div>
          )}
          {s.notice && (
            <div className="room-notice" role="status">
              <Sparkles size={18} />
              {s.notice}
            </div>
          )}
          <section className="room-about">
            <h3>Welcome to the mint squad ♡</h3>
            <p>
              A little gaming, a little chatting, and a lot of getting
              distracted. Get comfy, be kind, and make yourself at home. You
              belong here.
            </p>
            <div className="room-rules">
              <span>✧ Be kind</span>
              <span>✧ Respect the vibe</span>
              <span>✧ Stay a little weird</span>
            </div>
          </section>
        </section>
        <aside className="chat-panel">
          <div className="chat-heading">
            <span>
              <MessageCircle size={17} /> The cozy corner
            </span>
            <span className="chat-live">
              <span className="dot" />
              LIVE CHAT
            </span>
          </div>
          <div className="chat-pin">
            <span>📌</span>
            <p>
              New here? Say hello!
              <br />
              <b>There’s always room for one more. ♡</b>
            </p>
          </div>
          <div
            className="chat-messages"
            ref={chatRef}
            role="log"
            aria-label="Live chat"
            aria-live="polite"
          >
            {s.messages.map((m) => (
              <div
                className={`chat-message ${m.own ? "own-message" : ""}`}
                key={m.id}
              >
                <span className="chat-author" style={{ color: m.color }}>
                  {m.own ? "✦ " : ""}
                  {m.author}
                </span>
                <span>{m.text}</span>
                {m.own && (
                  <small className={`message-status ${m.status}`}>
                    {m.status === "queued" ? (
                      "◷ Waiting for connection…"
                    ) : m.status === "pending" ? (
                      "◌ Sending…"
                    ) : m.status === "sent" ? (
                      "✓ Sent"
                    ) : (
                      <button onClick={() => engine.retry(m.id)}>
                        Failed · retry ↻
                      </button>
                    )}
                  </small>
                )}
              </div>
            ))}
          </div>
          <div className="chat-bottom">
            {queued > 0 && (
              <div className="queue-label">
                Waiting for connection… <b>Outgoing Queue: {queued}</b>
              </div>
            )}
            <div className="chat-connection">
              <span className={`dot ${offline ? "offline-dot" : ""}`} />
              {s.state.toLowerCase()}
              <span>✦ {user.coins} coins</span>
            </div>
            <form onSubmit={send}>
              <div className="chat-input-wrap">
                <input
                  aria-label="Chat message"
                  maxLength={280}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Add a little to the chaos..."
                />
                <button
                  type="button"
                  aria-label="Add heart emoji"
                  onClick={() => setInput((old) => (old + " 💚").slice(0, 280))}
                >
                  ☺
                </button>
              </div>
              <div className="chat-send-row">
                <span>{input.length}/280 · Be a good pixel.</span>
                <button
                  className="button mint"
                  disabled={!input.trim()}
                  type="submit"
                >
                  Chat <Send size={13} />
                </button>
              </div>
            </form>
          </div>
        </aside>
      </div>
      {network && (
        <section className="network-panel">
          <div className="network-heading">
            <div>
              <h2>
                <Settings2 size={20} /> Behind the signal
              </h2>
              <p>
                Break the connection. Watch the recovery. Everything runs
                locally.
              </p>
            </div>
            <button
              className="button"
              onClick={() => setArchitecture(!architecture)}
            >
              <Code2 size={16} />
              {architecture ? "Hide architecture" : "Architecture"}
            </button>
          </div>
          <div className="network-modes">
            {(
              [
                "NORMAL",
                "HIGH LATENCY",
                "UNSTABLE",
                "DISCONNECT",
              ] as NetworkMode[]
            ).map((mode) => (
              <button
                className={s.mode === mode ? "active" : ""}
                key={mode}
                onClick={() => engine.setMode(mode)}
              >
                <span
                  className={`dot mode-${mode.split(" ")[0].toLowerCase()}`}
                />
                {mode}
                <small>
                  {mode === "NORMAL"
                    ? "20–80ms · clear skies"
                    : mode === "HIGH LATENCY"
                      ? "500–1500ms · slow lane"
                      : mode === "UNSTABLE"
                        ? "Spikes & packet loss"
                        : "Offline · keep chatting"}
                </small>
              </button>
            ))}
          </div>
          <div className="network-stats">
            {[
              ["Connection", s.state],
              ["Latency", `${s.latency} ms`],
              ["Pending / queued", `${pending} / ${queued}`],
              ["Last sequence", `#${s.lastSeq}`],
              ["Recovered events", s.recovered],
              ["Stream quality", s.quality],
              ["Reconnect attempt", String(s.attempt).padStart(2, "0")],
            ].map(([label, value]) => (
              <div key={label}>
                <small>{label}</small>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <p className="sim-disclaimer">
            <Code2 size={14} /> This demo currently uses a simulated transport.
            No real WebSocket backend or live video feed.
          </p>
          {architecture && (
            <div className="architecture">
              <div className="arch-flow">
                {[
                  "React UI",
                  "Realtime service",
                  "Transport interface",
                  "MockRealtimeAdapter · ACTIVE",
                ].map((label, i) => (
                  <div key={label}>
                    {i > 0 && <ArrowDown size={17} />}
                    <span>{label}</span>
                  </div>
                ))}
                <div className="future-adapter">WebSocketAdapter · FUTURE</div>
              </div>
              <div>
                <h3>Built to reconnect.</h3>
                <p>
                  The presentation subscribes to a single realtime service. A
                  transport contract keeps the mock adapter replaceable without
                  changing the UI.
                </p>
                <div className="achievement-chips">
                  {[
                    "ACK",
                    "Ordered queue",
                    "Exponential retry",
                    "Monotonic sequence",
                    "Deduplication",
                    "Event recovery",
                    "Connection state",
                    "Adaptive quality",
                  ].map((x) => (
                    <span key={x}>{x}</span>
                  ))}
                </div>
                <p>
                  Server history: 600 events · chat: 100 messages · particles:
                  12. Reconnect backoff: 1s → 2s → 4s → 8s. Quality restores one
                  step per 6 stable seconds.
                </p>
              </div>
            </div>
          )}
        </section>
      )}
    </>
  );
}
export default App;
