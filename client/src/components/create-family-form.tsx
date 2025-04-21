import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertFamilySchema, Family } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const createFamilySchema = insertFamilySchema.extend({
  name: z.string().min(2, "שם המשפחה חייב להכיל לפחות 2 תווים"),
});

type CreateFamilyFormValues = z.infer<typeof createFamilySchema>;

interface CreateFamilyFormProps {
  onSuccess?: () => void;
}

export default function CreateFamilyForm({ onSuccess }: CreateFamilyFormProps) {
  const { toast } = useToast();
  
  const form = useForm<CreateFamilyFormValues>({
    resolver: zodResolver(createFamilySchema),
    defaultValues: {
      name: "",
      imageUrl: "", // Ensure this is always a string, never null
    },
  });

  const createFamilyMutation = useMutation<Family, Error, CreateFamilyFormValues>({
    mutationFn: async (data: CreateFamilyFormValues) => {
      const res = await apiRequest("POST", "/api/families", data);
      return await res.json();
    },
    onSuccess: (family) => {
      toast({
        title: "משפחה נוצרה בהצלחה",
        description: "עכשיו אתה יכול להתחיל להעלות תמונות ולהזמין בני משפחה",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/families"] });
      if (onSuccess) onSuccess();
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "שגיאה ביצירת משפחה",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateFamilyFormValues) => {
    createFamilyMutation.mutate(data);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">יצירת משפחה חדשה</CardTitle>
        <CardDescription className="text-center">
          צור משפחה חדשה כדי להתחיל לשתף תמונות וליצור גזטה
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>שם המשפחה</FormLabel>
                  <FormControl>
                    <Input placeholder="לדוגמה: משפחת לוי" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>תמונת משפחה (אופציונלי)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="הכנס את כתובת התמונה" 
                      value={field.value || ''} 
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              className="w-full"
              disabled={createFamilyMutation.isPending}
            >
              {createFamilyMutation.isPending ? (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              ) : "צור משפחה"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}