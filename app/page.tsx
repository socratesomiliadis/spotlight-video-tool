"use client";

import { useState } from "react";
import VideoEditor from "./components/VideoEditor";
import { Upload, Film, Minimize2, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("video/")) {
      setSelectedFile(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith("video/")) {
      setSelectedFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="container mx-auto px-4 py-8">
        {!selectedFile ? (
          <div className="max-w-2xl mx-auto">
            <Card
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed p-16 text-center hover:border-primary transition-colors cursor-pointer"
            >
              <Upload className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Drop your video here
              </h3>
              <p className="text-muted-foreground mb-6">or</p>
              <label className="cursor-pointer inline-block bg-primary text-primary-foreground px-8 py-3 rounded-md font-semibold hover:bg-primary/90 transition-all">
                Choose File
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
              <p className="text-muted-foreground text-sm mt-4">
                Supports most video formats
              </p>
            </Card>
          </div>
        ) : (
          <VideoEditor
            file={selectedFile}
            onClose={() => setSelectedFile(null)}
          />
        )}
      </div>
    </div>
  );
}
