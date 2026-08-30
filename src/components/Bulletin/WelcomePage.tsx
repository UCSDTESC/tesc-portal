import { Card, CardContent, CardHeader, CardTitle } from "@components/components/ui/card";
import { Separator } from "@components/components/ui/separator";
import { container, item } from "@lib/constants";
import { motion } from "motion/react";
import { useEffect } from "react";

export function WelcomePage() {
  // useEffect(() => {
  //   document.title = "Welcome | TESC Portal";
  // }, []);
  return (
    <div className="min-h-screen bg-background flex justify-center px-4 py-10">
      <motion.div
        className="w-[95%] max-w-[1000px]"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* top hero-ish card, similar to the big rounded panel */}
        <motion.div
          className="w-full rounded-[22px] overflow-hidden bg-gradient-to-br from-[#3B7DB6] via-20% via-blue to-navy mb-6"
          variants={item}
        >
          {/* if you have a banner image, swap this whole div for <img /> */}
          <div className="p-8 text-white space-y-3">
            <p className="text-sm uppercase tracking-wide opacity-80">Member Bulletin Board</p>
            <h1 className="text-3xl font-bold tracking-tight">Welcome to the TESC Portal</h1>
            <p className=" text-lg opacity-80">
              This is your space to find events, announcements, and information regarding our
              engineering orgs.
            </p>
          </div>
        </motion.div>

        {/* info card */}
        <motion.div variants={item}>
          <Card className="shadow-none border bg-card/50 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-xl">What you can do here</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-md text-muted-foreground">
                This page is a lightweight dashboard for engineering orgs. Think of it as a pinned
                message, but nicer:
              </p>

              <ul className="text-md text-muted-foreground list-disc list-inside space-y-1">
                <li>View upcoming events being hosted by engineering orgs all over campus</li>
                <li>Get connected with potential employers</li>
                <li>Earn points by attending events</li>
                <li>
                  Any feedback is welcome&nbsp;
                  <a
                    href="https://docs.google.com/forms/d/e/1FAIpQLSfVzJQ8li2d8is_hpj3btZbfrYGp1FZR00_OojU5uG5YZ4yuA/viewform?usp=dialog"
                    className="text-blue hover:underline"
                  >
                    here on this feedback form
                  </a>
                </li>
              </ul>

              <Separator />

              {/* <p className="text-xs text-muted-foreground pt-2">
                Tip: only officers should post org-wide announcements.
              </p> */}
            </CardContent>
          </Card>
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
    <div className="min-h-screen bg-background flex justify-center px-4 py-10">
      <motion.div
        className="w-[95%] max-w-[1000px]"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* top hero-ish card, similar to the big rounded panel */}
        <motion.div
          className="w-full rounded-[22px] overflow-hidden bg-gradient-to-br from-[#3B7DB6] via-20% via-blue to-navy mb-6"
          variants={item}
        >
          {/* if you have a banner image, swap this whole div for <img /> */}
          <div className="p-8 text-white space-y-3">
            <p className="text-sm uppercase tracking-wide opacity-80">Sponsor Resume Bank</p>
            <h1 className="text-3xl font-bold tracking-tight">Welcome to the TESC Portal</h1>
            <p className=" text-lg opacity-80">
              This is your space to find potential future employees. Sift and filter through our
              member resume bank to find your potential perfect candidate.
            </p>
          </div>
        </motion.div>

        {/* info card */}
        <motion.div variants={item}>
          <Card className="shadow-none border bg-card/50 rounded-2xl">
            <CardHeader>
              <CardTitle className="text-xl">What you can do here</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-md text-muted-foreground">
                This page is a lightweight dashboard where we have collected and cultivated the
                resume of our members.
              </p>

              <ul className="text-md text-muted-foreground list-disc list-inside space-y-1">
                <li>View candidate profiles, their resumes and the events they have attended </li>
                <li>Get connected with potential employees</li>
                <li>Learn about what they do outside of just work and school</li>
              </ul>

              {accessState === "logged_out" && (
                <div className="space-y-3 pt-2">
                  <p className="text-md text-muted-foreground">
                    Log in with your approved work email to browse the resume bank. Recruiter
                    accounts use non-UCSD emails that have been allowlisted by TESC.
                  </p>
                  {onLogin && (
                    <button
                      type="button"
                      onClick={onLogin}
                      className="rounded-full bg-navy px-5 py-2 text-sm font-semibold text-white hover:opacity-90"
                    >
                      Log in to Recruiter Portal
                    </button>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Need access? Email{" "}
                    <a href="mailto:contact@tescatucsd.org" className="text-blue hover:underline">
                      contact@tescatucsd.org
                    </a>
                  </p>
                </div>
              )}

              {accessState === "unauthorized" && (
                <div className="space-y-2 pt-2">
                  <p className="text-md text-muted-foreground">
                    Your account does not have recruiter access yet. Email TESC with your company
                    name and work email to request access to the resume bank.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <a href="mailto:contact@tescatucsd.org" className="text-blue hover:underline">
                      contact@tescatucsd.org
                    </a>
                  </p>
                </div>
              )}

              <Separator />

              {/* <p className="text-xs text-muted-foreground pt-2">
                Tip: only officers should post org-wide announcements.
              </p> */}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
