import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

export default function TestUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
  };
  
  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsUploading(true);
      setResponse(null);
      
      // Create FormData
      const formData = new FormData();
      formData.append("file", file);
      formData.append("familyId", "3"); // Hardcoded for testing
      
      // Log the request details
      console.log("TEST UPLOAD REQUEST:", {
        file: file.name,
        size: file.size,
        type: file.type
      });
      
      // Make request
      const res = await fetch("/api/test-upload", {
        method: "POST",
        body: formData,
        credentials: "include"
      });
      
      // Get response as text
      const text = await res.text();
      console.log("TEST UPLOAD RESPONSE:", {
        status: res.status,
        text
      });
      
      setResponse(`Status: ${res.status}\nResponse: ${text}`);
      
      if (res.ok) {
        toast({
          title: "Upload successful",
          description: "File has been uploaded"
        });
      } else {
        toast({
          title: "Upload failed",
          description: `Status: ${res.status}`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Test upload error:", error);
      setResponse(`Error: ${error.message}`);
      toast({
        title: "Upload error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg border">
      <h2 className="text-xl font-bold mb-4">Test Photo Upload</h2>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          Select File
        </label>
        <input 
          type="file"
          onChange={handleFileChange}
          className="w-full border rounded p-2"
          accept="image/*"
        />
      </div>
      
      {file && (
        <div className="mb-4">
          <p className="text-sm">
            <strong>Selected file:</strong> {file.name} ({(file.size / 1024).toFixed(2)} KB)
          </p>
        </div>
      )}
      
      <Button
        onClick={handleUpload}
        disabled={!file || isUploading}
        className="w-full mb-4"
      >
        {isUploading ? "Uploading..." : "Upload File"}
      </Button>
      
      {response && (
        <div className="mt-4 p-3 bg-gray-100 rounded overflow-auto max-h-40">
          <pre className="text-xs whitespace-pre-wrap">{response}</pre>
        </div>
      )}
    </div>
  );
}