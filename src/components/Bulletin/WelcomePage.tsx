import { container, item } from "@lib/constants";
import { motion } from "motion/react";
import { useEffect } from "react";
import { CalendarDays, Compass, MessageSquareHeart, Sparkles, Users } from "lucide-react";

export function WelcomePage() {
  // useEffect(() => {
  //   document.title = "Welcome | TESC Portal";
  // }, []);
  return (
    <div className="flex justify-center px-2 py-2 sm:px-4">
      <motion.div
        className="w-full max-w-[1000px]"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* top hero-ish card, similar to the big rounded panel */}
        <motion.div
          className="card-shadow mb-6 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-navy-900 via-navy-800 to-brand-700"
          variants={item}
        >
          <div className="space-y-3 p-8 text-white">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-brand-400">
              <Compass className="h-3.5 w-3.5" />
              Member Bulletin Board
            </p>
            <h1 className="text-3xl font-bold tracking-tight">Welcome to the TESC Portal</h1>
            <p className="text-lg text-white/80">
              This is your space to find events, announcements, and information regarding our
              engineering orgs.
            </p>
          </div>
        </motion.div>

        {/* info card */}
        <motion.div variants={item}>
          <div className="card-shadow rounded-2xl border border-line bg-white p-6">
            <h2 className="text-xl font-bold tracking-tight text-ink">What you can do here</h2>
            <div className="mt-4 space-y-4">
              <p className="text-md text-ink-secondary">
                This page is a lightweight dashboard for engineering orgs. Think of it as a pinned
                message, but nicer:
              </p>

              <ul className="space-y-1.5 text-md text-ink-secondary">
                <li className="flex items-start gap-2">
                  <CalendarDays className="mt-1 h-4 w-4 shrink-0 text-brand-500" />
                  View upcoming events being hosted by engineering orgs all over campus
                </li>
                <li className="flex items-start gap-2">
                  <Users className="mt-1 h-4 w-4 shrink-0 text-brand-500" />
                  Get connected with potential employers
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="mt-1 h-4 w-4 shrink-0 text-brand-500" />
                  Earn points by attending events
                </li>
                <li className="flex items-start gap-2">
                  <MessageSquareHeart className="mt-1 h-4 w-4 shrink-0 text-brand-500" />
                  <span>
                    Any feedback is welcome&nbsp;
                    <a
                      href="https://docs.google.com/forms/d/e/1FAIpQLSfVzJQ8li2d8is_hpj3btZbfrYGp1FZR00_OojU5uG5YZ4yuA/viewform?usp=dialog"
                      className="font-medium text-brand-600 hover:underline"
                    >
                      here on this feedback form
                    </a>
                  </span>
                </li>
              </ul>

              <hr className="border-line" />

              {/* <p className="text-xs text-muted-foreground pt-2">
                Tip: only officers should post org-wide announcements.
              </p> */}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export function WelcomePageCompany({
  accessState = "authorized",
  onLogin,
}: {
  accessState?: "authorized" | "logged_out" | "unauthorized";
  onLogin?: () => void;
}) {
  useEffect(() => {
    document.title = "Welcome | TESC Portal";
  }, []);
  return (
    <div className="flex justify-center px-2 py-2 sm:px-4">
      <motion.div
        className="w-full max-w-[1000px]"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* top hero-ish card, similar to the big rounded panel */}
        <motion.div
          className="card-shadow mb-6 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-navy-900 via-navy-800 to-brand-700"
          variants={item}
        >
          <div className="space-y-3 p-8 text-white">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-brand-400">
              <Users className="h-3.5 w-3.5" />
              Sponsor Resume Bank
            </p>
            <h1 className="text-3xl font-bold tracking-tight">Welcome to the TESC Portal</h1>
            <p className="text-lg text-white/80">
              This is your space to find potential future employees. Sift and filter through our
              member resume bank to find your potential perfect candidate.
            </p>
          </div>
        </motion.div>

        {/* info card */}
        <motion.div variants={item}>
          <div className="card-shadow rounded-2xl border border-line bg-white p-6">
            <h2 className="text-xl font-bold tracking-tight text-ink">What you can do here</h2>
            <div className="mt-4 space-y-4">
              <p className="text-md text-ink-secondary">
                This page is a lightweight dashboard where we have collected and cultivated the
                resume of our members.
              </p>

              <ul className="list-inside list-disc space-y-1.5 text-md text-ink-secondary">
                <li>View candidate profiles, their resumes and the events they have attended </li>
                <li>Get connected with potential employees</li>
                <li>Learn about what they do outside of just work and school</li>
              </ul>

              {accessState === "logged_out" && (
                <div className="space-y-3 pt-2">
                  <p className="text-md text-ink-secondary">
                    Log in with your approved work email to browse the resume bank. Recruiter
                    accounts use non-UCSD emails that have been allowlisted by TESC.
                  </p>
                  {onLogin && (
                    <button
                      type="button"
                      onClick={onLogin}
                      className="rounded-full bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                    >
                      Log in to Recruiter Portal
                    </button>
                  )}
                  <p className="text-sm text-ink-secondary">
                    Need access? Email{" "}
                    <a
                      href="mailto:contact@tescatucsd.org"
                      className="font-medium text-brand-600 hover:underline"
                    >
                      contact@tescatucsd.org
                    </a>
                  </p>
                </div>
              )}

              {accessState === "unauthorized" && (
                <div className="space-y-2 pt-2">
                  <p className="text-md text-ink-secondary">
                    Your account does not have recruiter access yet. Email TESC with your company
                    name and work email to request access to the resume bank.
                  </p>
                  <p className="text-sm text-ink-secondary">
                    <a
                      href="mailto:contact@tescatucsd.org"
                      className="font-medium text-brand-600 hover:underline"
                    >
                      contact@tescatucsd.org
                    </a>
                  </p>
                </div>
              )}

              <hr className="border-line" />

              {/* <p className="text-xs text-muted-foreground pt-2">
                Tip: only officers should post org-wide announcements.
              </p> */}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
