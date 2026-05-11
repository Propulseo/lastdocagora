"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { fetchAIChatStats } from "@/app/(admin)/_actions/admin-ai-chat"
import type { AdminTranslations } from "@/lib/i18n/admin"

type Period = "today" | "7d" | "30d"

type Stats = Awaited<ReturnType<typeof fetchAIChatStats>>

interface AIChatAnalyticsProps {
  ct: AdminTranslations["aiChat"]
}

export function AIChatAnalytics({ ct }: AIChatAnalyticsProps) {
  const [period, setPeriod] = useState<Period>("7d")
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  const loadStats = useCallback(async (p: Period) => {
    setLoading(true)
    try {
      const data = await fetchAIChatStats(p)
      setStats(data)
    } catch {
      setStats(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStats(period)
  }, [period, loadStats])

  const periodButtons: { value: Period; label: string }[] = [
    { value: "today", label: ct.analytics.today },
    { value: "7d", label: ct.analytics.last7Days },
    { value: "30d", label: ct.analytics.last30Days },
  ]

  const fallbackTotal = stats
    ? stats.fallbackCounts[1] +
      stats.fallbackCounts[2] +
      stats.fallbackCounts[3] +
      stats.fallbackCounts[4]
    : 0

  const fallbackLevels: {
    key: 1 | 2 | 3 | 4
    label: string
    color: string
  }[] = [
    { key: 1, label: ct.analytics.level1, color: "bg-emerald-500" },
    { key: 2, label: ct.analytics.level2, color: "bg-sky-500" },
    { key: 3, label: ct.analytics.level3, color: "bg-amber-500" },
    { key: 4, label: ct.analytics.level4, color: "bg-rose-500" },
  ]

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex gap-2">
        {periodButtons.map((btn) => (
          <button
            key={btn.value}
            onClick={() => setPeriod(btn.value)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              period === btn.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="text-muted-foreground py-8 text-center text-sm">
          ...
        </div>
      )}

      {!loading && stats && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {ct.analytics.totalConversations}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.totalConversations}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {ct.analytics.avgMessages}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.avgMessages}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {ct.analytics.abandonRate}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{stats.abandonRate}%</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {ct.analytics.estimatedCost}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">${stats.estimatedCost}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {ct.analytics.totalTokens}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {stats.totalTokens.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {ct.analytics.latencyP50} / {ct.analytics.latencyP95}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {stats.latencyP50}
                  {ct.analytics.ms} / {stats.latencyP95}
                  {ct.analytics.ms}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Fallback Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                {ct.analytics.fallbackDistribution}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {fallbackTotal > 0 ? (
                <>
                  <div className="flex h-6 w-full overflow-hidden rounded-full">
                    {fallbackLevels.map((level) => {
                      const count = stats.fallbackCounts[level.key]
                      const pct = (count / fallbackTotal) * 100
                      if (pct === 0) return null
                      return (
                        <div
                          key={level.key}
                          className={`${level.color} transition-all`}
                          style={{ width: `${pct}%` }}
                        />
                      )
                    })}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                    {fallbackLevels.map((level) => (
                      <div key={level.key} className="flex items-center gap-2">
                        <div
                          className={`h-3 w-3 rounded-full ${level.color}`}
                        />
                        <span className="text-muted-foreground">
                          {level.label}: {stats.fallbackCounts[level.key]}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground text-sm">-</p>
              )}
            </CardContent>
          </Card>

          {/* Feedback Rate */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">
                {ct.analytics.feedbackRate}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-emerald-500" />
                  <span className="text-sm text-muted-foreground">
                    {ct.analytics.positive}: {stats.positive}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-rose-500" />
                  <span className="text-sm text-muted-foreground">
                    {ct.analytics.negative}: {stats.negative}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Specialties, Top Cities, Locale Distribution */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  {ct.analytics.topSpecialties}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.topSpecialties.length > 0 ? (
                  <ul className="space-y-1 text-sm">
                    {stats.topSpecialties.map(([name, count]) => (
                      <li
                        key={name}
                        className="flex items-center justify-between"
                      >
                        <span className="truncate text-muted-foreground">
                          {name}
                        </span>
                        <span className="font-medium">{count}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground text-sm">-</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  {ct.analytics.topCities}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.topCities.length > 0 ? (
                  <ul className="space-y-1 text-sm">
                    {stats.topCities.map(([name, count]) => (
                      <li
                        key={name}
                        className="flex items-center justify-between"
                      >
                        <span className="truncate text-muted-foreground">
                          {name}
                        </span>
                        <span className="font-medium">{count}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground text-sm">-</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">
                  {ct.analytics.localeDistribution}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Object.keys(stats.localeDistribution).length > 0 ? (
                  <ul className="space-y-1 text-sm">
                    {Object.entries(stats.localeDistribution)
                      .sort(([, a], [, b]) => b - a)
                      .map(([locale, count]) => (
                        <li
                          key={locale}
                          className="flex items-center justify-between"
                        >
                          <span className="text-muted-foreground uppercase">
                            {locale}
                          </span>
                          <span className="font-medium">{count}</span>
                        </li>
                      ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground text-sm">-</p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
