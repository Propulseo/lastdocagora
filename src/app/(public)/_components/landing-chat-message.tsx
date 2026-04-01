"use client"

import { Bot, User, Star, MapPin } from "lucide-react"
import type { LandingPro } from "@/lib/landing-chat-session"

interface ChatEntry {
  role: "user" | "assistant"
  content: string
  professionals?: LandingPro[]
}

export interface LandingChatMessageProps {
  msg: ChatEntry
  viewProfilesLabel: string
}

export function LandingChatMessage({ msg, viewProfilesLabel }: LandingChatMessageProps) {
  return (
    <div className="space-y-2">
      <div
        className={`flex gap-2.5 ${
          msg.role === "user" ? "flex-row-reverse" : ""
        }`}
      >
        <div
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
            msg.role === "user"
              ? "bg-primary text-primary-foreground"
              : "bg-muted"
          }`}
        >
          {msg.role === "user" ? (
            <User className="h-3.5 w-3.5" />
          ) : (
            <Bot className="h-3.5 w-3.5" />
          )}
        </div>
        <div
          className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
            msg.role === "user"
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : "bg-muted text-foreground rounded-tl-sm"
          }`}
        >
          {msg.content}
        </div>
      </div>

      {msg.professionals && msg.professionals.length > 0 && (
        <div className="ml-9 space-y-2">
          {msg.professionals.map((pro) => (
            <div
              key={pro.id}
              className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/30 p-3 transition-colors hover:bg-muted/50"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
                {(pro.first_name?.[0] ?? "").toUpperCase()}
                {(pro.last_name?.[0] ?? "").toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">
                  {pro.first_name} {pro.last_name}
                </p>
                <p className="text-xs text-muted-foreground truncate capitalize">
                  {pro.specialty?.replace(/_/g, " ")}
                </p>
                <div className="flex items-center gap-3 mt-0.5">
                  {pro.city && (
                    <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {pro.city}
                    </span>
                  )}
                  {pro.rating != null && (
                    <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {pro.rating.toFixed(1)}
                    </span>
                  )}
                  {pro.consultation_fee != null && (
                    <span className="text-xs text-muted-foreground">
                      {pro.consultation_fee}&euro;
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground italic pl-1">
            {viewProfilesLabel}
          </p>
        </div>
      )}
    </div>
  )
}
