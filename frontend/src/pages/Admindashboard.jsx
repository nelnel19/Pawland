import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  ComposedChart,
  Bar,
  Line,
  BarChart,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
} from "recharts";
import API from "../services/api";
import "../styles/Admindashboard.css";

const C = {
  pine: "#1b4d49",
  sage: "#4f9a7d",
  honey: "#e9a23b",
  sky: "#2f6f9f",
  clay: "#c0583c",
  slate: "#8aa09c",
  grid: "#e3ecea",
  track: "#eef4f2",
};

const STATUS_COLORS = {
  Pending: C.honey,
  "In Progress": C.sky,
  Resolved: C.sage,
  Rejected: C.clay,
  Approved: C.sage,
  Available: C.sage,
  Adopted: C.pine,
};

const ICONS = {
  users: "M16 20v-1a4 4 0 00-4-4H7a4 4 0 00-4 4v1M9.5 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM21 20v-1a4 4 0 00-3-3.9M16 4.2a3.5 3.5 0 010 6.6",
  reports: "M9 4h6a1 1 0 011 1v1H8V5a1 1 0 011-1zM8 6H6a1 1 0 00-1 1v13a1 1 0 001 1h12a1 1 0 001-1V7a1 1 0 00-1-1h-2M9 12h6M9 16h4",
  apps: "M14 3H7a1 1 0 00-1 1v16a1 1 0 001 1h10a1 1 0 001-1V8l-4-5zM14 3v5h5M9 14l2 2 4-4",
  home: "M3 11l9-8 9 8M5 10v10h14V10M10 20v-6h4v6",
  arrow: "M5 12h14M13 6l6 6-6 6",
};

function Icon({ name, size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

// Helper: build last N months labels
const buildMonthBuckets = (count = 6) => {
  const buckets = [];
  const now = new Date();

  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    buckets.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleString("en-US", { month: "short" }),
      year: d.getFullYear(),
      month: d.getMonth(),
      start: d,
    });
  }

  return buckets;
};

// Helper: bucket an array of documents by created month
const bucketByMonth = (items, buckets, keyName) => {
  const counts = buckets.map((b) => ({
    month: b.label,
    [keyName]: 0,
  }));

  items.forEach((item) => {
    const d = new Date(item.createdAt);
    const idx = buckets.findIndex(
      (b) => b.year === d.getFullYear() && b.month === d.getMonth()
    );
    if (idx !== -1) {
      counts[idx][keyName] += 1;
    }
  });

  return counts;
};

const countBy = (items, fn) => items.filter(fn).length;

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="admindash-tooltip">
      {label && <strong>{label}</strong>}
      {payload.map((p, i) => (
        <div key={i} className="admindash-tooltip-row">
          <span style={{ background: p.color || p.payload?.fill || p.fill }} />
          {p.name}: <b>{p.value}</b>
        </div>
      ))}
    </div>
  );
}

function Donut({ data, colors, centerLabel }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const shown = total ? data : [{ name: "No data", value: 1 }];

  return (
    <div className="admindash-donut">
      <div className="admindash-donut-chart">
        <ResponsiveContainer width="100%" height={210}>
          <PieChart>
            <Pie
              data={shown}
              dataKey="value"
              nameKey="name"
              innerRadius={66}
              outerRadius={94}
              paddingAngle={total ? 3 : 0}
              cornerRadius={6}
              stroke="none"
              startAngle={90}
              endAngle={-270}
            >
              {shown.map((d, i) => (
                <Cell
                  key={i}
                  fill={total ? colors[d.name] || colors[i % colors.length] || C.slate : C.track}
                />
              ))}
            </Pie>
            {total > 0 && <Tooltip content={<ChartTooltip />} />}
          </PieChart>
        </ResponsiveContainer>
        <div className="admindash-donut-center">
          <strong>{total}</strong>
          <span>{centerLabel}</span>
        </div>
      </div>

      <ul className="admindash-legend">
        {data.map((d, i) => (
          <li key={d.name}>
            <span
              className="admindash-dot"
              style={{ background: colors[d.name] || colors[i % colors.length] || C.slate }}
            />
            <em>{d.name}</em>
            <b>{d.value}</b>
            <small>{total ? Math.round((d.value / total) * 100) : 0}%</small>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Admindashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAdmins: 0,
    totalReports: 0,
    pendingReports: 0,
    resolvedReports: 0,
    totalApplications: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    rejectedApplications: 0,
    totalPets: 0,
    availablePets: 0,
    adoptedPets: 0,
    totalAnnouncements: 0,
  });

  const [trends, setTrends] = useState({});
  const [activity, setActivity] = useState([]);
  const [userGrowth, setUserGrowth] = useState([]);
  const [usersByRole, setUsersByRole] = useState([]);
  const [reportsByStatus, setReportsByStatus] = useState([]);
  const [reportsByType, setReportsByType] = useState([]);
  const [applicationsByStatus, setApplicationsByStatus] = useState([]);
  const [petsByStatus, setPetsByStatus] = useState([]);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    const bootstrap = async () => {
      try {
        const userRes = await API.get("/dashboard");
        setUser(userRes.data.user);

        if (userRes.data.user.role !== "Admin") {
          navigate("/dashboard", { replace: true });
          return;
        }

        // Fetch everything in parallel
        const [usersRes, reportsRes, applicationsRes, petsRes, annRes] =
          await Promise.all([
            API.get("/users"),
            API.get("/reports/all"),
            API.get("/applications/all"),
            API.get("/pets"),
            API.get("/announcements"),
          ]);

        const users = usersRes.data.users || [];
        const reports = reportsRes.data.reports || [];
        const applications = applicationsRes.data.applications || [];
        const pets = petsRes.data.pets || [];
        const announcements = annRes.data.announcements || [];

        // ---- Summary stats ----
        setStats({
          totalUsers: users.length,
          totalAdmins: countBy(users, (u) => u.role === "Admin"),
          totalReports: reports.length,
          pendingReports: countBy(reports, (r) => r.status === "Pending"),
          resolvedReports: countBy(reports, (r) => r.status === "Resolved"),
          totalApplications: applications.length,
          pendingApplications: countBy(applications, (a) => a.status === "Pending"),
          approvedApplications: countBy(applications, (a) => a.status === "Approved"),
          rejectedApplications: countBy(applications, (a) => a.status === "Rejected"),
          totalPets: pets.length,
          availablePets: countBy(pets, (p) => p.status === "Available"),
          adoptedPets: countBy(pets, (p) => p.status === "Adopted"),
          totalAnnouncements: announcements.length,
        });

        // ---- Monthly series ----
        const buckets = buildMonthBuckets(6);
        const uM = bucketByMonth(users, buckets, "users");
        const rM = bucketByMonth(reports, buckets, "reports");
        const aM = bucketByMonth(applications, buckets, "applications");

        setActivity(
          buckets.map((b, i) => ({
            month: b.label,
            Users: uM[i].users,
            Reports: rM[i].reports,
            Applications: aM[i].applications,
          }))
        );

        const last = buckets.length - 1;
        setTrends({
          users: { cur: uM[last].users, prev: uM[last - 1].users },
          reports: { cur: rM[last].reports, prev: rM[last - 1].reports },
          applications: { cur: aM[last].applications, prev: aM[last - 1].applications },
        });

        // Running total starts from users that existed before the first month
        let running = countBy(users, (u) => new Date(u.createdAt) < buckets[0].start);
        setUserGrowth(
          uM.map((m) => {
            running += m.users;
            return { month: m.month, "New users": m.users, "Total users": running };
          })
        );

        setUsersByRole([
          { name: "Users", value: countBy(users, (u) => u.role === "User") },
          { name: "Admins", value: countBy(users, (u) => u.role === "Admin") },
        ]);

        // ---- Reports ----
        setReportsByStatus(
          ["Pending", "In Progress", "Resolved", "Rejected"].map((s) => ({
            status: s,
            count: countBy(reports, (r) => r.status === s),
          }))
        );

        setReportsByType(
          ["Animal Abuse", "Animal Report"].map((t) => ({
            name: t,
            value: countBy(reports, (r) => r.reportType === t),
          }))
        );

        // ---- Applications ----
        setApplicationsByStatus(
          ["Pending", "Approved", "Rejected"].map((s) => ({
            name: s,
            value: countBy(applications, (a) => a.status === s),
          }))
        );

        // ---- Pets ----
        setPetsByStatus(
          ["Available", "Pending", "Adopted"].map((s) => ({
            name: s,
            value: countBy(pets, (p) => p.status === s),
          }))
        );

        // ---- Recent activity ----
        const feed = [
          ...reports.map((r) => ({
            id: `r-${r._id}`,
            kind: "Report",
            title: r.title,
            status: r.status,
            date: r.createdAt,
          })),
          ...applications.map((a) => ({
            id: `a-${a._id}`,
            kind: "Application",
            title: `${a.fullName || "Applicant"} for ${a.pet?.name || "a pet"}`,
            status: a.status,
            date: a.createdAt,
          })),
        ]
          .sort((x, y) => new Date(y.date) - new Date(x.date))
          .slice(0, 6);
        setRecent(feed);
      } catch (err) {
        console.error("ADMIN DASHBOARD ERROR:", err);

        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          navigate("/login", { replace: true });
        } else if (err.response?.status === 403) {
          navigate("/dashboard", { replace: true });
        } else {
          setError(err.response?.data?.message || "Failed to load dashboard.");
        }
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, [navigate]);

  if (loading) {
    return (
      <div className="admindash-loading">
        <div className="admindash-spinner"></div>
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  const firstName = user?.name?.split(" ")[0];
  const adoptionRate = stats.totalPets
    ? Math.round((stats.adoptedPets / stats.totalPets) * 100)
    : 0;

  const trendText = (t) => {
    if (!t) return "";
    const diff = t.cur - t.prev;
    if (diff === 0) return `${t.cur} this month, same as last`;
    return `${t.cur} this month, ${diff > 0 ? "up" : "down"} ${Math.abs(diff)} from last`;
  };

  const kpis = [
    { icon: "users", tone: "pine", label: "Total users", value: stats.totalUsers, sub: `${stats.totalAdmins} admin${stats.totalAdmins === 1 ? "" : "s"}`, trend: trends.users },
    { icon: "reports", tone: "sky", label: "Animal reports", value: stats.totalReports, sub: `${stats.pendingReports} pending`, trend: trends.reports },
    { icon: "apps", tone: "honey", label: "Applications", value: stats.totalApplications, sub: `${stats.pendingApplications} pending`, trend: trends.applications },
    { icon: "home", tone: "sage", label: "Pets listed", value: stats.totalPets, sub: `${stats.adoptedPets} adopted`, trend: null },
  ];

  const legend = [
    { name: "Users", color: C.pine },
    { name: "Reports", color: C.sky },
    { name: "Applications", color: C.honey },
  ];

  const axis = { stroke: C.slate, fontSize: 12, tickLine: false, axisLine: false };

  return (
    <div className="admindash-content">
      <section className="admindash-hero">
        <div className="admindash-hero-copy">
          <h1>Welcome back{firstName ? `, ${firstName}` : ""}.</h1>
          <p>
            Here is what is happening across PawLand: users, animal reports, adoption applications and pets.
          </p>
        </div>

        <div className="admindash-hero-actions">
          <button className="admindash-action" onClick={() => navigate("/admin/reports")}>
            <span>
              <strong>{stats.pendingReports}</strong>
              pending reports
            </span>
            <Icon name="arrow" size={18} />
          </button>
          <button className="admindash-action" onClick={() => navigate("/admin/applications")}>
            <span>
              <strong>{stats.pendingApplications}</strong>
              pending applications
            </span>
            <Icon name="arrow" size={18} />
          </button>
        </div>
      </section>

      {error && <p className="admindash-error" role="alert">{error}</p>}

      <section className="admindash-kpis">
        {kpis.map((k) => (
          <div className="admindash-kpi" key={k.label}>
            <div className={`admindash-kpi-icon tone-${k.tone}`}>
              <Icon name={k.icon} />
            </div>
            <div className="admindash-kpi-body">
              <span className="admindash-kpi-label">{k.label}</span>
              <span className="admindash-kpi-value">{k.value}</span>
              <span className="admindash-kpi-sub">{k.sub}</span>
              {k.trend && <span className="admindash-kpi-trend">{trendText(k.trend)}</span>}
            </div>
          </div>
        ))}
      </section>

      {/* Activity + applications */}
      <section className="admindash-grid admindash-grid-main">
        <div className="admindash-card">
          <div className="admindash-card-head">
            <div>
              <h2>Activity overview</h2>
              <p>New users, reports and applications over the last 6 months</p>
            </div>
            <ul className="admindash-inline-legend">
              {legend.map((l) => (
                <li key={l.name}>
                  <span className="admindash-dot" style={{ background: l.color }} />
                  {l.name}
                </li>
              ))}
            </ul>
          </div>

          <div className="admindash-chart">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={activity} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  {[["gUsers", C.pine], ["gReports", C.sky], ["gApps", C.honey]].map(([id, color]) => (
                    <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke={C.grid} vertical={false} />
                <XAxis dataKey="month" {...axis} dy={8} />
                <YAxis {...axis} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: C.slate, strokeDasharray: "4 4" }} />
                <Area type="monotone" dataKey="Users" stroke={C.pine} strokeWidth={2.5} fill="url(#gUsers)" dot={{ r: 3, strokeWidth: 2, fill: "#fff" }} activeDot={{ r: 6 }} />
                <Area type="monotone" dataKey="Reports" stroke={C.sky} strokeWidth={2.5} fill="url(#gReports)" dot={{ r: 3, strokeWidth: 2, fill: "#fff" }} activeDot={{ r: 6 }} />
                <Area type="monotone" dataKey="Applications" stroke={C.honey} strokeWidth={2.5} fill="url(#gApps)" dot={{ r: 3, strokeWidth: 2, fill: "#fff" }} activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="admindash-card">
          <div className="admindash-card-head">
            <div>
              <h2>Applications</h2>
              <p>Where every adoption application stands</p>
            </div>
          </div>
          <Donut data={applicationsByStatus} colors={STATUS_COLORS} centerLabel="applications" />
        </div>
      </section>

      {/* Users + reports by status */}
      <section className="admindash-grid admindash-grid-2">
        <div className="admindash-card">
          <div className="admindash-card-head">
            <div>
              <h2>User growth</h2>
              <p>New sign-ups each month and the running total</p>
            </div>
          </div>

          <div className="admindash-chart">
            <ResponsiveContainer width="100%" height={270}>
              <ComposedChart data={userGrowth} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke={C.grid} vertical={false} />
                <XAxis dataKey="month" {...axis} dy={8} />
                <YAxis {...axis} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(27,77,73,0.06)" }} />
                <Bar dataKey="New users" fill={C.honey} radius={[8, 8, 0, 0]} barSize={26} />
                <Line type="monotone" dataKey="Total users" stroke={C.pine} strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: "#fff" }} activeDot={{ r: 6 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="admindash-card">
          <div className="admindash-card-head">
            <div>
              <h2>Reports by status</h2>
              <p>Current processing state of every report</p>
            </div>
          </div>

          <div className="admindash-chart">
            <ResponsiveContainer width="100%" height={270}>
              <BarChart data={reportsByStatus} layout="vertical" margin={{ top: 4, right: 34, left: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" stroke={C.grid} horizontal={false} />
                <XAxis type="number" {...axis} allowDecimals={false} />
                <YAxis type="category" dataKey="status" {...axis} width={86} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(27,77,73,0.06)" }} />
                <Bar dataKey="count" name="Reports" radius={[0, 10, 10, 0]} barSize={24} background={{ fill: C.track, radius: 10 }}>
                  {reportsByStatus.map((e) => (
                    <Cell key={e.status} fill={STATUS_COLORS[e.status] || C.pine} />
                  ))}
                  <LabelList dataKey="count" position="right" style={{ fontSize: 12, fontWeight: 700, fill: "#1f302e" }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Three small donuts */}
      <section className="admindash-grid admindash-grid-3">
        <div className="admindash-card">
          <div className="admindash-card-head">
            <div>
              <h2>Pets by status</h2>
              <p>Adoption rate: <strong>{adoptionRate}%</strong></p>
            </div>
          </div>
          <Donut data={petsByStatus} colors={STATUS_COLORS} centerLabel="pets" />
        </div>

        <div className="admindash-card">
          <div className="admindash-card-head">
            <div>
              <h2>Reports by type</h2>
              <p>Animal abuse and general reports</p>
            </div>
          </div>
          <Donut data={reportsByType} colors={[C.clay, C.sky]} centerLabel="reports" />
        </div>

        <div className="admindash-card">
          <div className="admindash-card-head">
            <div>
              <h2>Users by role</h2>
              <p>User and admin accounts</p>
            </div>
          </div>
          <Donut data={usersByRole} colors={[C.pine, C.honey]} centerLabel="accounts" />
        </div>
      </section>

      {/* Recent activity */}
      <section className="admindash-card admindash-recent">
        <div className="admindash-card-head">
          <div>
            <h2>Recent activity</h2>
            <p>The latest reports and applications</p>
          </div>
        </div>

        {recent.length === 0 ? (
          <p className="admindash-muted">Nothing has been submitted yet.</p>
        ) : (
          <ul className="admindash-feed">
            {recent.map((item) => (
              <li key={item.id}>
                <span className={`admindash-feed-kind kind-${item.kind.toLowerCase()}`}>
                  {item.kind}
                </span>
                <span className="admindash-feed-title">{item.title}</span>
                <span
                  className={`admindash-feed-status status-${String(item.status).toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {item.status}
                </span>
                <span className="admindash-feed-date">
                  {new Date(item.date).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default Admindashboard;