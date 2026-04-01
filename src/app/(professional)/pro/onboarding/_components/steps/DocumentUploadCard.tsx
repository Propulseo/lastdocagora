"use client";

import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, CheckCircle, Info } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const ACCEPTED_DOC_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
];
const MAX_DOC_SIZE = 5 * 1024 * 1024;

interface DocumentUploadCardProps {
  userId: string;
  labels: {
    documents: string;
    license: string;
    diploma: string;
    uploadHint: string;
    upload: string;
    uploaded: string;
    verificationNote: string;
    invalidFormat: string;
    fileTooLarge: string;
    uploadError: string;
  };
}

export function DocumentUploadCard({ userId, labels }: DocumentUploadCardProps) {
  const [licenseUploaded, setLicenseUploaded] = useState(false);
  const [diplomaUploaded, setDiplomaUploaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const licenseRef = useRef<HTMLInputElement>(null);
  const diplomaRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  async function uploadDoc(file: File, docType: "license" | "diploma") {
    if (!ACCEPTED_DOC_TYPES.includes(file.type)) {
      toast.error(labels.invalidFormat);
      return;
    }
    if (file.size > MAX_DOC_SIZE) {
      toast.error(labels.fileTooLarge);
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "pdf";
      const path = `${userId}/${docType}.${ext}`;

      const { error } = await supabase.storage
        .from("professional-docs")
        .upload(path, file, { upsert: true, contentType: file.type });

      if (error) throw error;

      if (docType === "license") setLicenseUploaded(true);
      else setDiplomaUploaded(true);
    } catch {
      toast.error(labels.uploadError);
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{labels.documents}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{labels.license}</p>
            <p className="text-xs text-muted-foreground">{labels.uploadHint}</p>
          </div>
          {licenseUploaded ? (
            <span className="flex items-center gap-1 text-sm text-green-600">
              <CheckCircle className="size-4" />
              {labels.uploaded}
            </span>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => licenseRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="size-3.5" />
                {labels.upload}
              </Button>
              <input
                ref={licenseRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadDoc(file, "license");
                  e.target.value = "";
                }}
              />
            </>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{labels.diploma}</p>
            <p className="text-xs text-muted-foreground">{labels.uploadHint}</p>
          </div>
          {diplomaUploaded ? (
            <span className="flex items-center gap-1 text-sm text-green-600">
              <CheckCircle className="size-4" />
              {labels.uploaded}
            </span>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => diplomaRef.current?.click()}
                disabled={uploading}
              >
                <Upload className="size-3.5" />
                {labels.upload}
              </Button>
              <input
                ref={diplomaRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadDoc(file, "diploma");
                  e.target.value = "";
                }}
              />
            </>
          )}
        </div>

        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950">
          <Info className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-sm text-amber-700 dark:text-amber-300">
            {labels.verificationNote}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
