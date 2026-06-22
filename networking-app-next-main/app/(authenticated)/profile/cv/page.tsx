"use client";
import { useState, useRef, useCallback } from "react";
import { useAuthStore } from "@/app/stores/authStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Loader2, Upload, FileText, CheckCircle, AlertCircle, GraduationCap, Briefcase, Code, User, ArrowLeft, Mail, Phone, Linkedin, Github } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import Link from "next/link";
import { updateCvData } from "@/app/api/auth";

type CvData = {
  name?: string;
  contact?: { email?: string; phone?: string; linkedin?: string; github?: string };
  skills?: string[];
  education?: { degree?: string; period?: string; description?: string }[];
  experience?: { title_or_company?: string; period?: string; details?: string; description?: string }[];
  sections?: Record<string, string>;
  page_count?: number;
  error?: string;
  stored_for_user?: string;
};

export default function CvUploadPage() {
  const auth = useAuthStore((state) => state.user);
  const [file, setFile] = useState<File | null>(null);
  const [cvData, setCvData] = useState<CvData | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf") {
        setFile(droppedFile);
        setCvData(null);
      } else {
        toast.error("Please upload a PDF file");
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setCvData(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post(
        `http://localhost:3030/cv/parse/?user_id=${auth.id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (res.data?.error) {
        toast.error(res.data.error);
      } else {
        setCvData(res.data);

        // Persist CV data to user-service PostgreSQL
        try {
          const { raw_text, ...dataToStore } = res.data;
          await updateCvData(auth.id, JSON.stringify(dataToStore));
          toast.success("CV parsed and saved to your profile!");
        } catch (saveErr) {
          console.error("Failed to save CV to profile:", saveErr);
          toast.success("CV parsed! (Could not save to profile)");
        }
      }
    } catch (e: any) {
      toast.error("Failed to upload CV");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen pt-24 px-6 md:px-24 w-full max-w-4xl mx-auto gap-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/profile/${auth.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Upload Your CV</h1>
          <p className="text-muted-foreground mt-1">
            Upload your resume to get better job recommendations based on your skills and experience
          </p>
        </div>
      </div>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload PDF
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? "border-primary bg-primary/5"
                : file
                ? "border-green-500 bg-green-500/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
              id="cv-file-input"
            />

            {file ? (
              <div className="flex flex-col items-center gap-3">
                <FileText className="h-12 w-12 text-green-500" />
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleUpload}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Parsing...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Parse CV
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFile(null);
                      setCvData(null);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Upload className="h-12 w-12 text-muted-foreground/50" />
                <p className="font-medium">Drag & drop your CV here</p>
                <p className="text-sm text-muted-foreground">or</p>
                <Button
                  variant="outline"
                  onClick={() => inputRef.current?.click()}
                >
                  Browse Files
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Only PDF files are accepted
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Parsed Results */}
      {cvData && !cvData.error && (
        <div className="flex flex-col gap-4">
          {/* Success Banner */}
          <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-950/20 p-3 rounded-lg">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">
              CV parsed successfully! ({cvData.page_count} page{cvData.page_count !== 1 ? "s" : ""})
            </span>
          </div>

          {/* Name & Contact */}
          {(cvData.name || cvData.contact) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {cvData.name && (
                  <p className="text-xl font-semibold">{cvData.name}</p>
                )}
                {cvData.contact?.email && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5" /> {cvData.contact.email}
                  </p>
                )}
                {cvData.contact?.phone && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5" /> {cvData.contact.phone}
                  </p>
                )}
                {cvData.contact?.linkedin && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Linkedin className="h-3.5 w-3.5" /> {cvData.contact.linkedin}
                  </p>
                )}
                {cvData.contact?.github && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Github className="h-3.5 w-3.5" /> {cvData.contact.github}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Skills */}
          {cvData.skills && cvData.skills.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Code className="h-5 w-5" />
                  Skills Detected ({cvData.skills.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {cvData.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Education */}
          {cvData.education && cvData.education.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <GraduationCap className="h-5 w-5" />
                  Education
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {cvData.education.map((edu, i) => (
                    <div key={i} className="border-l-2 border-primary/30 pl-4">
                      {edu.degree && <p className="font-medium">{edu.degree}</p>}
                      {edu.description && <p className="text-sm">{edu.description}</p>}
                      {edu.period && (
                        <p className="text-xs text-muted-foreground mt-1">{edu.period}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Experience */}
          {cvData.experience && cvData.experience.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Briefcase className="h-5 w-5" />
                  Experience
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {cvData.experience.map((exp, i) => (
                    <div key={i} className="border-l-2 border-primary/30 pl-4">
                      {exp.title_or_company && (
                        <p className="font-medium">{exp.title_or_company}</p>
                      )}
                      {exp.description && <p className="text-sm">{exp.description}</p>}
                      {exp.details && (
                        <p className="text-sm text-muted-foreground">{exp.details}</p>
                      )}
                      {exp.period && (
                        <p className="text-xs text-muted-foreground mt-1">{exp.period}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Raw Sections */}
          {cvData.sections && Object.keys(cvData.sections).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">All Detected Sections</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(cvData.sections).map((section) => (
                    <span
                      key={section}
                      className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm capitalize"
                    >
                      {section}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Error State */}
      {cvData?.error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-950/20 p-3 rounded-lg">
          <AlertCircle className="h-5 w-5" />
          <span>{cvData.error}</span>
        </div>
      )}
    </div>
  );
}
