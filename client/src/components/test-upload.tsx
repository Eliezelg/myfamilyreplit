import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function TestUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Create preview
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);
      
      // Clean up previous preview
      return () => URL.revokeObjectURL(objectUrl);
    }
  };

  const handleCaptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCaption(e.target.value);
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("caption", caption);
      formData.append("familyId", "3"); // Hardcoded for testing
      
      console.log("Uploading file with FormData:", {
        file: file.name,
        caption,
        familyId: 3
      });

      const response = await fetch("/api/basic-test-upload", {
        method: "POST",
        body: formData,
        credentials: "include"
      });

      const result = await response.json();
      console.log("Upload result:", result);
      setUploadResult(result);

      if (result.success) {
        toast({
          title: "Upload successful",
          description: "The file was uploaded successfully",
        });
      } else {
        toast({
          title: "Upload failed",
          description: result.message || "Unknown error",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast({
        title: "Upload error",
        description: error.message || "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleReset = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setFile(null);
    setCaption("");
    setPreview(null);
    setUploadResult(null);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Test Upload Component</CardTitle>
        <CardDescription>
          Use this component to test file uploads with captions
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Select file to upload
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              className="block w-full text-sm border border-gray-300 rounded-md"
              ref={fileInputRef}
              accept="image/*"
            />
          </div>
          
          {preview && (
            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">Preview</label>
              <div className="border rounded-md overflow-hidden max-w-sm max-h-[300px]">
                <img 
                  src={preview} 
                  alt="Preview" 
                  className="object-contain w-full h-full"
                />
              </div>
            </div>
          )}
          
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">
              Caption
            </label>
            <Textarea
              value={caption}
              onChange={handleCaptionChange}
              placeholder="Enter a caption for the image"
              className="resize-none"
              rows={3}
            />
          </div>
          
          {uploadResult && (
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <h4 className="font-medium mb-2">Upload Result:</h4>
              <pre className="whitespace-pre-wrap text-sm bg-gray-100 p-2 rounded">
                {JSON.stringify(uploadResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleReset}>
          Reset
        </Button>
        <Button 
          onClick={handleUpload} 
          disabled={!file || isUploading}
        >
          {isUploading ? "Uploading..." : "Upload File"}
        </Button>
      </CardFooter>
    </Card>
  );
}