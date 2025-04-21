import { useState } from "react";
import TestUpload from "@/components/test-upload";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

export default function TestUploadPage() {
  const [activeTab, setActiveTab] = useState("basic");
  const { toast } = useToast();
  const [testResults, setTestResults] = useState<any>(null);

  // Function to test basic upload endpoint
  const testBasicUploadEndpoint = async () => {
    try {
      const response = await fetch('/api/test-upload-status');
      const data = await response.json();
      setTestResults(data);
      
      toast({
        title: "API Test Result",
        description: data.message,
      });
    } catch (error: any) {
      console.error('API test error:', error);
      setTestResults({ error: error.message });
      
      toast({
        title: "API Test Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container max-w-5xl py-8">
      <h1 className="text-3xl font-bold mb-6">Upload Testing</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>API Endpoint Testing</CardTitle>
          <CardDescription>
            Test if the upload API endpoints are accessible
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={testBasicUploadEndpoint}>
            Test API Endpoints
          </Button>
          
          {testResults && (
            <div className="mt-4 p-3 bg-gray-50 rounded-md">
              <pre className="whitespace-pre-wrap text-sm overflow-auto max-h-[200px]">
                {JSON.stringify(testResults, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 mb-6">
          <TabsTrigger value="basic">Basic Upload</TabsTrigger>
          <TabsTrigger value="caption">Caption Upload</TabsTrigger>
        </TabsList>
        
        <TabsContent value="basic" className="mt-2">
          <TestUpload />
        </TabsContent>
        
        <TabsContent value="caption" className="mt-2">
          <CaptionTestUpload />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CaptionTestUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const { toast } = useToast();

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
      
      console.log("Uploading file to caption test endpoint with FormData:", {
        file: file.name,
        caption,
        familyId: 3
      });

      const response = await fetch("/api/caption-test-upload", {
        method: "POST",
        body: formData,
        credentials: "include"
      });

      const result = await response.json();
      console.log("Caption upload result:", result);
      setUploadResult(result);

      if (result.success) {
        toast({
          title: "Upload successful",
          description: "The file was uploaded successfully with caption",
        });
      } else {
        toast({
          title: "Upload failed",
          description: result.message || "Unknown error",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error uploading file with caption:", error);
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
    setFile(null);
    setCaption("");
    setPreview(null);
    setUploadResult(null);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Caption Test Upload</CardTitle>
        <CardDescription>
          Test upload with captions using the dedicated caption endpoint
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
              Caption (Test Field)
            </label>
            <textarea
              value={caption}
              onChange={handleCaptionChange}
              placeholder="Enter a caption for the image"
              className="resize-none w-full min-h-[100px] p-2 border border-gray-300 rounded-md"
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
          {isUploading ? "Uploading..." : "Test Caption Upload"}
        </Button>
      </CardFooter>
    </Card>
  );
}