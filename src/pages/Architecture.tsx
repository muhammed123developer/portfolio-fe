import {
  Database,
  KeyRound,
  Layers,
  Rocket,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react'

import { Seo } from '@/components/common/Seo'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

/**
 * How this site is built.
 *
 * Written for a technical interview: the diagrams show the actual request path
 * and the notes explain *why* each decision was made, not just what it was.
 *
 * Diagrams are CSS and semantic markup rather than a rendering library — they
 * stay legible in both themes, scale on a phone, cost no bundle weight, and
 * are readable by a screen reader, which an <img> of a diagram is not.
 */
export default function Architecture() {
  return (
    <>
      <Seo
        title="Architecture"
        description="How this portfolio is built: request flow, layering, authentication, data modelling, security and deployment."
      />

      <div className="mx-auto w-full max-w-4xl px-4 py-14 sm:px-6 sm:py-20">
        <header className="mb-12">
          <Badge variant="secondary" className="mb-4">
            For the technically curious
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Architecture</h1>
          <p className="text-muted-foreground mt-3 max-w-2xl text-lg text-pretty">
            This site is a full-stack application rather than a static page. Here is how a request
            actually travels through it, and the reasoning behind the structure.
          </p>
        </header>

        {/* ------------------------------------------------- Request flow */}
        <section className="mb-14">
          <h2 className="mb-2 text-2xl font-semibold tracking-tight">The request path</h2>
          <p className="text-muted-foreground mb-6">
            Every read on this page followed exactly this route.
          </p>

          <Card className="overflow-hidden">
            <CardContent className="overflow-x-auto p-6">
              <ol className="flex min-w-[560px] flex-col gap-0">
                {REQUEST_FLOW.map((step, index) => (
                  <li key={step.label}>
                    <div className="flex items-center gap-4">
                      <span
                        className={`flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${step.tone}`}
                        aria-hidden="true"
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{step.label}</p>
                        <p className="text-muted-foreground text-sm">{step.detail}</p>
                      </div>
                    </div>
                    {index < REQUEST_FLOW.length - 1 && (
                      <span
                        aria-hidden="true"
                        className="bg-border ml-[18px] block h-5 w-px"
                      />
                    )}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </section>

        {/* ---------------------------------------------------- Layering */}
        <section className="mb-14">
          <h2 className="mb-2 flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <Layers className="text-primary size-6" aria-hidden="true" />
            Layering
          </h2>
          <p className="text-muted-foreground mb-6">
            Each layer has one job, and the rule that keeps them honest is that a layer may only
            talk to the one directly beneath it.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {LAYERS.map((layer) => (
              <Card key={layer.name}>
                <CardHeader>
                  <CardTitle className="text-base">{layer.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <p className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
                      Owns
                    </p>
                    <p>{layer.owns}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
                      Never does
                    </p>
                    <p className="text-muted-foreground">{layer.never}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator className="my-12" />

        {/* ------------------------------------------------------- Tabs */}
        <section>
          <h2 className="mb-6 text-2xl font-semibold tracking-tight">Design decisions</h2>

          <Tabs defaultValue="auth">
            <TabsList className="mb-6 flex h-auto w-full flex-wrap justify-start gap-1">
              <TabsTrigger value="auth" className="gap-1.5">
                <KeyRound className="size-3.5" aria-hidden="true" />
                Authentication
              </TabsTrigger>
              <TabsTrigger value="data" className="gap-1.5">
                <Database className="size-3.5" aria-hidden="true" />
                Data
              </TabsTrigger>
              <TabsTrigger value="security" className="gap-1.5">
                <ShieldCheck className="size-3.5" aria-hidden="true" />
                Security
              </TabsTrigger>
              <TabsTrigger value="scale" className="gap-1.5">
                <TrendingUp className="size-3.5" aria-hidden="true" />
                Scalability
              </TabsTrigger>
              <TabsTrigger value="deploy" className="gap-1.5">
                <Rocket className="size-3.5" aria-hidden="true" />
                Deployment
              </TabsTrigger>
            </TabsList>

            {DECISION_TABS.map((tab) => (
              <TabsContent key={tab.value} value={tab.value} className="space-y-4">
                {tab.points.map((point) => (
                  <Card key={point.title}>
                    <CardHeader>
                      <CardTitle className="text-base">{point.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-muted-foreground space-y-3 text-sm leading-relaxed">
                      <p>{point.body}</p>
                      {point.code && (
                        <pre className="bg-muted text-foreground overflow-x-auto rounded-lg p-3 text-xs">
                          <code>{point.code}</code>
                        </pre>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            ))}
          </Tabs>
        </section>
      </div>
    </>
  )
}

/* ------------------------------------------------------------------ Data */

const REQUEST_FLOW = [
  {
    label: 'React component',
    detail: 'Calls a service function through useApi — never axios directly.',
    tone: 'bg-primary/10 text-primary',
  },
  {
    label: 'Axios client',
    detail: 'Attaches credentials and the CSRF header, normalises every error.',
    tone: 'bg-primary/10 text-primary',
  },
  {
    label: 'Express middleware',
    detail: 'helmet → CORS → cookie parser → rate limiter.',
    tone: 'bg-muted text-muted-foreground',
  },
  {
    label: 'Auth + CSRF guard',
    detail: 'Mutations only. Public reads skip straight past.',
    tone: 'bg-muted text-muted-foreground',
  },
  {
    label: 'express-validator',
    detail: 'Rejects malformed input with a 422 and a per-field message map.',
    tone: 'bg-muted text-muted-foreground',
  },
  {
    label: 'Controller',
    detail: 'Reads the request, calls a service, sends the envelope. Nothing else.',
    tone: 'bg-muted text-muted-foreground',
  },
  {
    label: 'Service',
    detail: 'All business logic: slugs, uniqueness, date rules, cascade cleanup.',
    tone: 'bg-muted text-muted-foreground',
  },
  {
    label: 'Repository',
    detail: 'A storage interface. The implementation behind it is swappable.',
    tone: 'bg-primary/10 text-primary',
  },
  {
    label: 'Persistence',
    detail: 'In-memory store today, MongoDB via Mongoose behind the same interface.',
    tone: 'bg-primary/10 text-primary',
  },
]

const LAYERS = [
  {
    name: 'Validator',
    owns: 'Request shape — required fields, formats, lengths, enum membership.',
    never: 'Business rules that need to consult stored data.',
  },
  {
    name: 'Controller',
    owns: 'HTTP: reading the request, setting status codes, sending the envelope.',
    never: 'Touches a repository or builds a query.',
  },
  {
    name: 'Service',
    owns: 'Business logic, cross-entity rules, orchestration across repositories.',
    never: 'Knows which storage backend is active.',
  },
  {
    name: 'Repository',
    owns: 'Storage mechanics: filtering, sorting, pagination, persistence.',
    never: 'Business rules.',
  },
]

/**
 * Explicitly typed rather than inferred with `as const`.
 *
 * With `as const` TypeScript builds a union of each object's exact literal
 * shape, so `point.code` is an error on the members that happen to omit it.
 * Declaring the type once makes `code` uniformly optional.
 */
interface DecisionPoint {
  title: string
  body: string
  code?: string
}

interface DecisionTab {
  value: string
  points: DecisionPoint[]
}

const DECISION_TABS: DecisionTab[] = [
  {
    value: 'auth',
    points: [
      {
        title: 'The token lives in an httpOnly cookie, not localStorage',
        body: 'A token in localStorage is readable by any script on the page, so a single XSS flaw hands an attacker a valid session. An httpOnly cookie is invisible to JavaScript entirely. The trade-off is that browsers attach cookies automatically, which is precisely what CSRF exploits — so that has to be answered too.',
        code: 'Set-Cookie: token=<jwt>; HttpOnly; SameSite=Lax; Secure',
      },
      {
        title: 'CSRF is handled with a double-submit token',
        body: 'At login the server also sets a readable csrfToken cookie. The Axios interceptor reads it and echoes it in a header, and the server compares the two using a constant-time comparison. An attacker’s page can cause the cookie to be sent but cannot read its value, so it cannot forge the header.',
        code: "X-CSRF-Token: <value of csrfToken cookie>",
      },
      {
        title: 'Login responses are deliberately uninformative',
        body: 'A wrong password and an unknown email return the byte-identical 401 message, and the unknown-email path still runs a bcrypt comparison before failing. Without that, the faster response on a missing account leaks which addresses are registered.',
      },
    ],
  },
  {
    value: 'data',
    points: [
      {
        title: 'A repository interface sits between services and storage',
        body: 'Services depend on an interface expressed in domain vocabulary — findMany(filter), not a database query object. That is what lets the storage backend be replaced without touching a controller, a service or any frontend code.',
      },
      {
        title: 'Ids are 24-character hex from day one',
        body: 'The in-memory store generates ids in exactly the shape MongoDB produces, so validators, URLs and frontend types need no changes when the real database is connected.',
      },
      {
        title: 'Cross-field rules live in services, not schemas',
        body: 'Date ordering and uniqueness were originally schema validators. Moving them into the service layer means they hold for every storage backend, and that an update validates the merged record rather than only the fields in the request.',
      },
      {
        title: 'Calendar dates are strings, not timestamps',
        body: 'A role that began in "March 2023" has no time of day. Stored as a timestamp, a timezone conversion can render it as February. Keeping "YYYY-MM-DD" end to end removes the class of bug entirely.',
      },
    ],
  },
  {
    value: 'security',
    points: [
      {
        title: 'Defence in layers',
        body: 'helmet sets security headers, CORS names one exact origin because credentialed requests cannot use a wildcard, and rate limiting is tiered — the login endpoint is far stricter than a public read, and the contact form stricter still.',
      },
      {
        title: 'Passwords are never stored or logged in plain text',
        body: 'bcrypt with a cost factor of 12. The hash is excluded from query results by default, so returning it from an endpoint is impossible by construction rather than by remembering to strip it.',
      },
      {
        title: 'Errors never leak internals',
        body: 'One central handler maps every failure to a safe message. Unexpected errors are logged in full server-side and reduced to a generic 500 for the client, so no stack trace or driver detail reaches the browser.',
      },
      {
        title: 'Input is validated twice',
        body: 'React Hook Form validates for responsiveness; express-validator validates for safety. The frontend check is a convenience — anyone can POST directly to the API, so the server assumes nothing.',
      },
    ],
  },
  {
    value: 'scale',
    points: [
      {
        title: 'Pagination everywhere it matters',
        body: 'Projects and the message inbox are paginated with a server-enforced maximum page size, so no client can request the entire collection at once.',
      },
      {
        title: 'Related data is resolved in bulk',
        body: 'Projects reference technologies, and those are resolved for the whole page in one pass rather than per row — the N+1 problem avoided by design rather than discovered in production.',
      },
      {
        title: 'The frontend is code-split by route',
        body: 'Each page is lazily loaded, so a first-time visitor downloads the home page rather than the entire admin panel they may never open.',
      },
      {
        title: 'Dashboard counts are one request',
        body: 'Seven statistics arrive from a single endpoint backed by count queries, instead of seven round trips each loading a full collection to measure its length.',
      },
    ],
  },
  {
    value: 'deploy',
    points: [
      {
        title: 'Configuration is validated at boot',
        body: 'Every environment variable is parsed and checked once at startup. A missing or malformed value stops the process immediately with a message naming the problem, rather than surfacing as a 500 under traffic later.',
      },
      {
        title: 'Frontend and backend deploy independently',
        body: 'The frontend is a static bundle for any CDN; the backend is a Node service. They share nothing but the HTTP contract, so either can be redeployed or scaled without the other.',
      },
      {
        title: 'Shutdown is graceful',
        body: 'On SIGTERM the server stops accepting connections, lets in-flight requests finish, flushes pending state and exits — with a hard timeout so a wedged socket cannot block a restart indefinitely.',
      },
    ],
  },
]
