"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  ExternalLink,
  Loader2,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { RADIUS } from "@/lib/design-tokens";
import { useProfessionalI18n } from "@/lib/i18n/pro";
import { useCalendarIntegration } from "../_hooks/useCalendarIntegration";

interface CalendarIntegrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSyncComplete: () => void;
}

export function CalendarIntegrationDialog({
  open,
  onOpenChange,
  onSyncComplete,
}: CalendarIntegrationDialogProps) {
  const { t } = useProfessionalI18n();
  const {
    calendars,
    loading,
    syncing,
    revoking,
    activeConnections,
    handleConnectGoogle,
    handleRevoke,
    handleToggleCalendar,
    handleSync,
  } = useCalendarIntegration(open, onSyncComplete);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`sm:max-w-lg max-h-[80vh] overflow-y-auto ${RADIUS.card}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t.agenda.calendarIntegration}
          </DialogTitle>
          <DialogDescription>
            {t.agenda.calendarIntegrationDesc}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Connect buttons */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">
              {t.agenda.connectCalendar}
            </h4>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={handleConnectGoogle}
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Google Calendar
              </Button>
            </div>
          </div>

          {/* Active connections */}
          {activeConnections.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">
                  {t.agenda.connectedAccounts}
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 h-7"
                  onClick={handleSync}
                  disabled={syncing}
                >
                  {syncing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  {t.agenda.syncNow}
                </Button>
              </div>

              {activeConnections.map((conn) => (
                <div
                  key={conn.id}
                  className={`flex items-center justify-between ${RADIUS.element} border p-3`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center ${RADIUS.badge} bg-muted`}>
                      <ExternalLink className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium capitalize">
                        {conn.provider}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {conn.account_email}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleRevoke(conn.id)}
                    disabled={revoking === conn.id}
                  >
                    {revoking === conn.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Calendars */}
          {calendars.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium">
                {t.agenda.selectCalendars}
              </h4>
              <div className="space-y-2">
                {calendars.map((cal) => (
                  <div
                    key={cal.id}
                    className={`flex items-center justify-between ${RADIUS.element} border p-3`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{
                          backgroundColor: cal.color ?? "#4285F4",
                        }}
                      />
                      <div>
                        <p className="text-sm font-medium">
                          {cal.name}
                          {cal.is_primary && (
                            <Badge
                              variant="secondary"
                              className="ml-2 text-xs"
                            >
                              {t.agenda.calendarPrimary}
                            </Badge>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {cal.calendar_connections.account_email}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={cal.selected}
                      onCheckedChange={(checked) =>
                        handleToggleCalendar(cal.id, checked)
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && activeConnections.length === 0 && (
            <div className="text-center py-6 text-sm text-muted-foreground">
              {t.agenda.noCalendarConnected}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
