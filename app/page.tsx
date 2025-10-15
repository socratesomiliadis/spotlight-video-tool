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
      <div className="w-full">
        {!selectedFile ? (
          <div className="w-full ">
            <Card
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed bg-black/0 hover:bg-black/5 p-16 text-center border-gray-300 transition-colors duration-300 cursor-pointer flex flex-col items-center justify-center"
            >
              <span className="size-12 -mr-2 text-black/30">
                <svg
                  width="100%"
                  viewBox="0 0 48 48"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2 27.75H10.7273M2 27.75V18.75M2 27.75V36.75M10.7273 27.75H29.2727M10.7273 27.75V36.75M10.7273 27.75V18.75M29.2727 27.75H38M29.2727 27.75V37.75M29.2727 27.75V18.75M38 27.75V18.75M38 27.75V37.75M29.2727 45.75H33.6364C36.0463 45.75 38 43.7963 38 41.3864V37.75M29.2727 45.75V37.75M29.2727 45.75H10.7273M29.2727 9.75H33.6364C36.0463 9.75 38 11.7037 38 14.1136V18.75M29.2727 9.75V18.75M29.2727 9.75H10.7273M29.2727 18.75H38M29.2727 37.75H38M10.7273 45.75H6.36364C3.95367 45.75 2 43.7963 2 41.3864V36.75M10.7273 45.75V36.75M10.7273 9.75H6.36364C3.95367 9.75 2 11.7037 2 14.1136V18.75M10.7273 9.75V18.75M2 18.75H10.7273M2 36.75H10.7273"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="square"
                    strokeLinejoin="round"
                  />
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M47 4.5C47 4.71478 46.8259 4.88889 46.6111 4.88889L43.8889 4.88889L43.8889 7.61111C43.8889 7.82589 43.7148 8 43.5 8C43.2852 8 43.1111 7.82589 43.1111 7.61111L43.1111 4.88889L40.3889 4.88889C40.1741 4.88889 40 4.71478 40 4.5C40 4.28522 40.1741 4.11111 40.3889 4.11111L43.1111 4.11111L43.1111 1.38889C43.1111 1.17411 43.2852 1 43.5 1C43.7148 1 43.8889 1.17411 43.8889 1.38889L43.8889 4.11111L46.6111 4.11111C46.8259 4.11111 47 4.28522 47 4.5Z"
                    fill="currentColor"
                    stroke="currentColor"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <h3 className="text-xl font-semibold text-foreground my-2">
                Drop your video here
              </h3>
              <p className="text-muted-foreground mb-6">or</p>
              <label className="cursor-pointer inline-block bg-primary text-primary-foreground px-6 py-2 rounded-lg lg:rounded-xl font-semibold hover:bg-primary/90 transition-all">
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
